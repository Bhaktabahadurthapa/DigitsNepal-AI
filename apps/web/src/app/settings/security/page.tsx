import { PageTitle } from "@/components/dashboard/shell";
import { TwoFactorSetup } from "@/components/dashboard/settings-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert } from "@/components/ui/feedback";
import { requireViewer } from "@/server/authz";

export default async function SecurityPage({ searchParams }: { searchParams: Promise<{ mfa?: string }> }) {
  const viewer = await requireViewer("/settings/security");
  const sp = await searchParams;
  return (
    <>
      <PageTitle title="Security" />
      {sp.mfa === "required" && (
        <Alert tone="warning" className="mb-6 max-w-3xl" title="Two-factor authentication required">
          Administration requires an authenticator app (TOTP). Enable it below, then return to the admin area.
        </Alert>
      )}
      <Card className="max-w-3xl">
        <CardHeader><CardTitle as="h2">Two-factor authentication (TOTP)</CardTitle></CardHeader>
        <CardContent><TwoFactorSetup enabled={viewer.twoFactorEnabled} /></CardContent>
      </Card>
    </>
  );
}
