export function ProsePage({ title, lead, children, updated }: { title: string; lead?: string; children: React.ReactNode; updated?: string }) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-14 sm:px-6">
      <h1 className="text-3xl font-bold text-navy sm:text-4xl">{title}</h1>
      {lead && <p className="mt-3 text-lg text-muted">{lead}</p>}
      {updated && <p className="mt-2 text-xs text-muted">Last updated: {updated}</p>}
      <div className="prose-lesson mt-8 max-w-none">{children}</div>
    </div>
  );
}
