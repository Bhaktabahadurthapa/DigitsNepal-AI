import Link from "next/link";
import { PageTitle } from "@/components/dashboard/shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { getDict } from "@/lib/i18n";

/** Honest placeholder: this feature is planned but not implemented. */
export default async function Page() {
  const { t } = await getDict();
  return (
    <>
      <PageTitle title={t.dash.paths} />
      <EmptyState title={t.common.comingSoon} action={<Button asChild variant="outline"><Link href="/academy">{t.nav.academy}</Link></Button>}>
        Guided learning paths that group several courses are planned. Until then, browse individual courses in the Academy.
      </EmptyState>
    </>
  );
}
