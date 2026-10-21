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
      <PageTitle title={t.dash.projects} />
      <EmptyState title={t.common.comingSoon} action={<Button asChild variant="outline"><Link href="/agents">{t.nav.agents}</Link></Button>}>
        Hands-on projects will connect to Agent Lab tutorials. They are not available yet.
      </EmptyState>
    </>
  );
}
