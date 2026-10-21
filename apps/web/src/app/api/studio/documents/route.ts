import { NextResponse } from "next/server";
import { apiRole, HttpError, route } from "@/server/authz";
import { MAX_UPLOAD_BYTES } from "@/server/services/files";
import { listDocuments, uploadDocument } from "@/server/services/library";

export const GET = route(async (req) => {
  const v = await apiRole("educator");
  const org = new URL(req.url).searchParams.get("organizationId");
  return NextResponse.json({ documents: await listDocuments(v, org) });
});

export const POST = route(async (req) => {
  const v = await apiRole("educator");
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_UPLOAD_BYTES + 64 * 1024) throw new HttpError(413, "file_too_large");
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) throw new HttpError(400, "file_required");
  const organizationId = (form.get("organizationId") as string | null) || null;
  const result = await uploadDocument(
    v,
    { name: file.name, bytes: new Uint8Array(await file.arrayBuffer()) },
    { organizationId, rightsConfirmed: form.get("rightsConfirmed") === "true" },
  );
  return NextResponse.json({ documentId: result.document.id, jobId: result.job.id, scan: result.scan }, { status: 201 });
});
