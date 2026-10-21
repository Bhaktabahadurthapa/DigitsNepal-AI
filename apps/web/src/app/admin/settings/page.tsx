import { LimitsForm } from "@/components/admin/actions";
import { PageTitle } from "@/components/dashboard/shell";
import { getLimits } from "@/server/services/ai-guard";

export default async function AdminSettings() {
  const limits = await getLimits();
  return (
    <>
      <PageTitle title="Configuration" subtitle="Application-level AI cost controls. These are enforced before every AI call; they do not rely on provider billing alerts." />
      <LimitsForm initial={limits} />
    </>
  );
}
