import { Suspense } from "react";
import { ForgotForm } from "@/components/site/auth-forms";
import { getDict } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getDict();
  return { title: t.auth.resetTitle };
}

export default async function Page() {
  const { t } = await getDict();
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-navy">{t.auth.resetTitle}</h1>
      <Suspense>
        <ForgotForm />
      </Suspense>
    </>
  );
}
