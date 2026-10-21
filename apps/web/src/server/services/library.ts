import { createHash } from "node:crypto";
import { and, desc, eq, isNull, sql } from "drizzle-orm";
import type { Viewer } from "@/server/authz";
import { db, schema } from "@/server/db";
import { HttpError } from "@/server/errors";
import { isEducator, loadAccessibleDocument, requireOrgRole } from "./access";
import { audit } from "./audit";
import { checkUpload, safeFilename } from "./files";
import { enqueueJob } from "./jobs";
import { scanBytes } from "./scan";
import { storage } from "./storage";

export async function uploadDocument(
  v: Viewer,
  file: { name: string; bytes: Uint8Array },
  opts: { organizationId?: string | null; rightsConfirmed: boolean },
) {
  if (!isEducator(v)) throw new HttpError(403, "educator_required");
  if (!opts.rightsConfirmed) throw new HttpError(400, "rights_not_confirmed", "Confirm that you have the right to use this material.");
  if (opts.organizationId) await requireOrgRole(v, opts.organizationId, ["owner", "admin", "member"]);
  const check = checkUpload(file.name, file.bytes);
  if (!check.ok) throw new HttpError(400, check.reason);

  const scan = await scanBytes(file.bytes);
  if (scan.status === "infected") {
    await audit(v.id, "document.rejected_malware", undefined, { filename: safeFilename(file.name) }, opts.organizationId);
    throw new HttpError(400, "file_rejected", "The file failed the security scan.");
  }
  const sha256 = createHash("sha256").update(file.bytes).digest("hex");
  const id = crypto.randomUUID();
  const scope = opts.organizationId ? `org/${opts.organizationId}` : `user/${v.id}`;
  const storageKey = `${scope}/${id}.${check.ext}`;
  await storage().put(storageKey, file.bytes, check.mime);
  const retentionDays = Number(process.env.SOURCE_RETENTION_DAYS ?? 365);
  const [doc] = await db
    .insert(schema.sourceDocuments)
    .values({
      id,
      ownerId: v.id,
      organizationId: opts.organizationId ?? null,
      filename: safeFilename(file.name),
      mimeType: check.mime,
      sizeBytes: file.bytes.length,
      sha256,
      storageKey,
      rightsConfirmed: true,
      retentionUntil: new Date(Date.now() + retentionDays * 86_400_000),
    })
    .returning();
  const job = await enqueueJob("extract_source", { ownerId: v.id, documentId: doc.id, organizationId: doc.organizationId });
  await audit(v.id, "document.uploaded", { type: "document", id: doc.id }, { sizeBytes: doc.sizeBytes, scan: scan.status }, doc.organizationId);
  return { document: doc, job, scan: scan.status };
}

/** Personal library, or an organization's library for members allowed to see it. */
export async function listDocuments(v: Viewer, organizationId?: string | null) {
  if (organizationId) await requireOrgRole(v, organizationId, ["owner", "admin", "reviewer", "member"]);
  const scope = organizationId
    ? eq(schema.sourceDocuments.organizationId, organizationId)
    : and(eq(schema.sourceDocuments.ownerId, v.id), isNull(schema.sourceDocuments.organizationId));
  return db
    .select({
      id: schema.sourceDocuments.id,
      filename: schema.sourceDocuments.filename,
      status: schema.sourceDocuments.status,
      error: schema.sourceDocuments.error,
      sizeBytes: schema.sourceDocuments.sizeBytes,
      pageCount: schema.sourceDocuments.pageCount,
      injectionFlags: schema.sourceDocuments.injectionFlags,
      createdAt: schema.sourceDocuments.createdAt,
      chunks: sql<number>`(select count(*)::int from source_chunks c where c.document_id = ${schema.sourceDocuments.id})`,
      usedBy: sql<number>`(select count(*)::int from course_sources cs where cs.document_id = ${schema.sourceDocuments.id})`,
    })
    .from(schema.sourceDocuments)
    .where(and(scope, isNull(schema.sourceDocuments.deletedAt)))
    .orderBy(desc(schema.sourceDocuments.createdAt));
}

export async function readDocumentBytes(v: Viewer, documentId: string) {
  const doc = await loadAccessibleDocument(v, documentId);
  await audit(v.id, "document.downloaded", { type: "document", id: doc.id }, {}, doc.organizationId);
  return { doc, bytes: await storage().get(doc.storageKey) };
}

export async function deleteDocument(v: Viewer, documentId: string) {
  const doc = await loadAccessibleDocument(v, documentId);
  if (doc.ownerId !== v.id && !v.roles.includes("admin")) throw new HttpError(403, "forbidden");
  const [inUse] = await db.select({ c: sql<number>`count(*)::int` }).from(schema.courseSources).where(eq(schema.courseSources.documentId, documentId));
  if (inUse.c > 0) throw new HttpError(409, "document_in_use", "Remove this document from its courses before deleting it.");
  await db.delete(schema.sourceChunks).where(eq(schema.sourceChunks.documentId, documentId));
  await db.update(schema.sourceDocuments).set({ deletedAt: new Date() }).where(eq(schema.sourceDocuments.id, documentId));
  await storage().delete(doc.storageKey);
  await audit(v.id, "document.deleted", { type: "document", id: documentId }, {}, doc.organizationId);
}
