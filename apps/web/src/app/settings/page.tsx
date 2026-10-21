import { PageTitle } from "@/components/dashboard/shell";
import { EducatorRequest, ProfileForm } from "@/components/dashboard/settings-forms";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, Badge } from "@/components/ui/feedback";
import { getDict } from "@/lib/i18n";
import { requireViewer } from "@/server/authz";

export default async function SettingsPage() {
  const viewer = await requireViewer("/settings");
  const { t } = await getDict();
  return (
    <>
      <PageTitle title={t.dash.profile} />
      <div className="grid max-w-3xl gap-6">
        <Card>
          <CardHeader><CardTitle as="h2">{t.dash.profile}</CardTitle></CardHeader>
          <CardContent>
            <ProfileForm name={viewer.name} language={viewer.preferredLanguage} />
            <p className="mt-4 text-sm text-muted">Roles: {viewer.roles.map((r) => <Badge key={r} className="mr-1">{r}</Badge>)}</p>
            {viewer.isMinor && (
              <Alert tone={viewer.guardianConsent ? "success" : "warning"} className="mt-4" title={t.auth.under18}>
                {viewer.guardianConsent ? "Consent recorded." : t.auth.under18Hint}
              </Alert>
            )}
          </CardContent>
        </Card>
        <Card id="educator">
          <CardHeader><CardTitle as="h2">{t.dash.becomeEducator}</CardTitle></CardHeader>
          <CardContent>
            {viewer.roles.includes("educator") || viewer.roles.includes("admin") ? (
              <Alert tone="success">Educator access is active.</Alert>
            ) : viewer.educatorStatus === "pending" ? (
              <Alert tone="info">Your request is waiting for review by an administrator.</Alert>
            ) : (
              <EducatorRequest rejected={viewer.educatorStatus === "rejected"} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
