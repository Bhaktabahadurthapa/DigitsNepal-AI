import { apiViewer, route } from "@/server/authz";
import { readDocumentBytes } from "@/server/services/library";

type Ctx = { params: Promise<{ id: string }> };

/** Authorized download. Always served as an attachment with a fixed, safe content type. */
export const GET = route<Ctx>(async (_req, { params }) => {
  const v = await apiViewer();
  const { doc, bytes } = await readDocumentBytes(v, (await params).id);
  return new Response(Buffer.from(bytes), {
    headers: {
      "content-type": doc.mimeType,
      "content-disposition": `attachment; filename*=UTF-8''${encodeURIComponent(doc.filename)}`,
      "x-content-type-options": "nosniff",
      "cache-control": "private, no-store",
    },
  });
});
