"use client";

import { Download, Trash2, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/dialog";
import { Label } from "@/components/ui/input";

export function LibraryUpload({ organizationId }: { organizationId?: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [rights, setRights] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="space-y-3 rounded-xl border border-line bg-surface p-5"
      onSubmit={async (e) => {
        e.preventDefault();
        if (!file) return;
        setBusy(true);
        const fd = new FormData();
        fd.set("file", file);
        fd.set("rightsConfirmed", String(rights));
        if (organizationId) fd.set("organizationId", organizationId);
        const r = await fetch("/api/studio/documents", { method: "POST", body: fd });
        setBusy(false);
        const data = await r.json().catch(() => ({}));
        if (!r.ok) return toast.error(data.message ?? data.error ?? "Upload failed");
        toast.success("Uploaded. Processing in the background.");
        (e.target as HTMLFormElement).reset();
        setFile(null);
        setRights(false);
        router.refresh();
      }}
    >
      <Label htmlFor="lib-file">Upload a document (PDF, DOCX, MD, TXT · max 10 MB)</Label>
      <input id="lib-file" type="file" accept=".pdf,.docx,.md,.txt" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm file:mr-3 file:min-h-11 file:cursor-pointer file:rounded-lg file:border-0 file:bg-navy file:px-4 file:font-semibold file:text-white" />
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1 size-4 accent-teal-700" checked={rights} onChange={(e) => setRights(e.target.checked)} />
        <span>I have the right to use this material for education, and it contains no unnecessary personal data.</span>
      </label>
      <Button type="submit" disabled={!file || !rights || busy}><Upload aria-hidden /> {busy ? "Uploading…" : "Upload"}</Button>
    </form>
  );
}

export function LibraryActions({ id, inUse }: { id: string; inUse: boolean }) {
  const router = useRouter();
  return (
    <div className="flex justify-end gap-1">
      <Button asChild variant="ghost" size="sm"><a href={`/api/studio/documents/${id}/download`} aria-label="Download"><Download /></a></Button>
      <ConfirmDialog
        trigger={<Button variant="ghost" size="sm" aria-label="Delete" disabled={inUse} title={inUse ? "Remove from courses first" : undefined}><Trash2 /></Button>}
        title="Delete this document?"
        description="The file and its indexed passages are removed permanently."
        confirmLabel="Delete"
        tone="danger"
        onConfirm={async () => {
          const r = await fetch(`/api/studio/documents/${id}`, { method: "DELETE" });
          if (!r.ok) toast.error("Could not delete");
          router.refresh();
        }}
      />
    </div>
  );
}
