import { Suspense } from "react";
import { SignInForm } from "@/components/site/auth-forms";
import { getDict } from "@/lib/i18n";

export async function generateMetadata() {
  const { t } = await getDict();
  return { title: t.auth.signInTitle };
}

export default async function Page() {
  const { t } = await getDict();
  return (
    <>
      <h1 className="mb-6 text-2xl font-bold text-navy">{t.auth.signInTitle}</h1>
      <Suspense>
        <SignInForm />
      </Suspense>
    </>
  );
}
