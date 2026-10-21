import { PageTitle } from "@/components/dashboard/shell";
import { LibraryActions, LibraryUpload } from "@/components/studio/library";
import { Badge, EmptyState } from "@/components/ui/feedback";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { getDict } from "@/lib/i18n";
import { formatDate } from "@/lib/utils";
import { requireRole } from "@/server/authz";
import { listDocuments } from "@/server/services/library";

export const metadata = { title: "Knowledge library" };

export default async function LibraryPage() {
  const viewer = await requireRole("educator", "/dashboard/educator/library");
  const [{ t, locale }, docs] = await Promise.all([getDict(), listDocuments(viewer)]);
  return (
    <>
      <PageTitle title={t.dash.library} subtitle="Your private source documents. Only you (and platform administrators) can open them. Learners only see quoted passages in citations." />
      <LibraryUpload />
      <div className="mt-6">
        {docs.length === 0 ? <EmptyState title="No documents yet">Upload a PDF, DOCX, Markdown or text file.</EmptyState> : (
          <Table caption={t.dash.library}>
            <THead><tr><TH>File</TH><TH>Status</TH><TH>Passages</TH><TH>Used by</TH><TH>Uploaded</TH><TH><span className="sr-only">Actions</span></TH></tr></THead>
            <TBody>
              {docs.map((d) => (
                <TR key={d.id}>
                  <TD className="font-medium">{d.filename}<span className="block text-xs text-muted">{(d.sizeBytes / 1024).toFixed(0)} KB{d.pageCount ? ` · ${d.pageCount} pages` : ""}</span></TD>
                  <TD>
                    <Badge tone={d.status === "ready" ? "green" : d.status === "failed" ? "red" : "amber"}>{d.status}</Badge>
                    {d.injectionFlags > 0 && <Badge tone="amber" className="ml-1">{d.injectionFlags} flagged</Badge>}
                    {d.error && <span className="mt-1 block text-xs text-red-700">{d.error}</span>}
                  </TD>
                  <TD>{d.chunks}</TD>
                  <TD>{d.usedBy} course(s)</TD>
                  <TD>{formatDate(d.createdAt, locale)}</TD>
                  <TD><LibraryActions id={d.id} inUse={d.usedBy > 0} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
        )}
      </div>
    </>
  );
}
