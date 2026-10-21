import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { db, schema } from "@/server/db";

export type RetrievedChunk = {
  id: string;
  documentId: string;
  filename: string;
  heading: string | null;
  content: string;
  pageStart: number | null;
  flaggedInjection: boolean;
  distance: number;
};

/**
 * Vector search restricted to an explicit allow-list of document ids. Callers MUST compute the
 * allow-list from the viewer's permissions (e.g. the published course's source documents).
 */
export async function searchChunks(documentIds: string[], queryVector: number[], k = 6): Promise<RetrievedChunk[]> {
  if (documentIds.length === 0) return [];
  if (queryVector.length === 0 || queryVector.some((x) => !Number.isFinite(x))) throw new Error("invalid query vector");
  // Pass the vector as a pgvector literal parameter (a plain number[] is sent as numeric).
  const distance = sql`(${schema.sourceChunks.embedding} <=> ${`[${queryVector.join(",")}]`}::vector)`;
  const rows = await db
    .select({
      id: schema.sourceChunks.id,
      documentId: schema.sourceChunks.documentId,
      filename: schema.sourceDocuments.filename,
      heading: schema.sourceChunks.heading,
      content: schema.sourceChunks.content,
      pageStart: schema.sourceChunks.pageStart,
      flaggedInjection: schema.sourceChunks.flaggedInjection,
      distance: sql<number>`${distance}`,
    })
    .from(schema.sourceChunks)
    .innerJoin(schema.sourceDocuments, eq(schema.sourceDocuments.id, schema.sourceChunks.documentId))
    .where(
      and(
        inArray(schema.sourceChunks.documentId, documentIds),
        eq(schema.sourceDocuments.status, "ready"),
        isNull(schema.sourceDocuments.deletedAt),
        sql`${schema.sourceChunks.embedding} is not null`,
      ),
    )
    // Flagged (possible prompt-injection) chunks are pushed down the ranking.
    .orderBy(sql`${distance} + case when ${schema.sourceChunks.flaggedInjection} then 0.5 else 0 end`)
    .limit(k);
  return rows.map((r) => ({ ...r, distance: Number(r.distance) }));
}

export async function chunksForDocuments(documentIds: string[], limit = 400) {
  if (documentIds.length === 0) return [];
  return db
    .select({
      id: schema.sourceChunks.id,
      documentId: schema.sourceChunks.documentId,
      filename: schema.sourceDocuments.filename,
      heading: schema.sourceChunks.heading,
      content: schema.sourceChunks.content,
      pageStart: schema.sourceChunks.pageStart,
      flaggedInjection: schema.sourceChunks.flaggedInjection,
      ordinal: schema.sourceChunks.ordinal,
    })
    .from(schema.sourceChunks)
    .innerJoin(schema.sourceDocuments, eq(schema.sourceDocuments.id, schema.sourceChunks.documentId))
    .where(and(inArray(schema.sourceChunks.documentId, documentIds), isNull(schema.sourceDocuments.deletedAt)))
    .orderBy(schema.sourceChunks.documentId, schema.sourceChunks.ordinal)
    .limit(limit);
}
