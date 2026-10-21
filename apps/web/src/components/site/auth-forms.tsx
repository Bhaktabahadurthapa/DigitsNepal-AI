"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { FieldError, FieldHint, Input, Label } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/lib/i18n/client";

function safeNext(n: string | null) {
  return n && n.startsWith("/") && !n.startsWith("//") ? n : "/dashboard/learner";
}

const signInSchema = z.object({ email: z.email(), password: z.string().min(1) });

export function SignInForm() {
  const { t } = useI18n();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(signInSchema) });
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(async (v) => {
        setError(null);
        const r = await authClient.signIn.email({ email: v.email, password: v.password });
        if (r.error) return setError(r.error.status === 429 ? t.common.error : t.auth.invalid);
        if ((r.data as { twoFactorRedirect?: boolean } | null)?.twoFactorRedirect) return router.push(`/two-factor?next=${encodeURIComponent(next)}`);
        router.push(next);
        router.refresh();
      })}
    >
      {error && <Alert tone="error">{error}</Alert>}
      <div>
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!formState.errors.email} {...register("email")} />
        <FieldError>{formState.errors.email && t.auth.email}</FieldError>
      </div>
      <div>
        <Label htmlFor="password">{t.auth.password}</Label>
        <Input id="password" type="password" autoComplete="current-password" aria-invalid={!!formState.errors.password} {...register("password")} />
      </div>
      <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? t.common.loading : t.auth.signIn}
      </Button>
      <div className="flex justify-between text-sm">
        <Link href="/forgot-password" className="text-teal-700 underline">{t.auth.forgot}</Link>
        <Link href={`/sign-up?next=${encodeURIComponent(next)}`} className="text-teal-700 underline">{t.auth.signUp}</Link>
      </div>
    </form>
  );
}

const signUpSchema = z.object({ name: z.string().trim().min(2).max(80), email: z.email(), password: z.string().min(10).max(128), minor: z.boolean() });

export function SignUpForm() {
  const { t } = useI18n();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(signUpSchema), defaultValues: { minor: false } });
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(async (v) => {
        setError(null);
        const r = await authClient.signUp.email({ email: v.email, password: v.password, name: v.name });
        if (r.error) return setError(r.error.message ?? t.common.error);
        if (v.minor) await fetch("/api/me/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ isMinor: true }) });
        router.push(next);
        router.refresh();
      })}
    >
      {error && <Alert tone="error">{error}</Alert>}
      <div>
        <Label htmlFor="name">{t.auth.name}</Label>
        <Input id="name" autoComplete="name" aria-invalid={!!formState.errors.name} {...register("name")} />
        <FieldError>{formState.errors.name && t.auth.name}</FieldError>
      </div>
      <div>
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!formState.errors.email} {...register("email")} />
        <FieldError>{formState.errors.email && t.auth.email}</FieldError>
      </div>
      <div>
        <Label htmlFor="password">{t.auth.password}</Label>
        <Input id="password" type="password" autoComplete="new-password" aria-describedby="pw-hint" aria-invalid={!!formState.errors.password} {...register("password")} />
        <FieldHint id="pw-hint">{t.auth.passwordHint}</FieldHint>
        <FieldError>{formState.errors.password && t.auth.passwordHint}</FieldError>
      </div>
      <div className="flex items-start gap-3 rounded-lg bg-bg p-3">
        <input id="minor" type="checkbox" className="mt-1 size-5 accent-teal-700" {...register("minor")} aria-describedby="minor-hint" />
        <div>
          <label htmlFor="minor" className="text-sm font-medium">{t.auth.under18}</label>
          <p id="minor-hint" className="text-sm text-muted">{t.auth.under18Hint}</p>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={formState.isSubmitting}>
        {formState.isSubmitting ? t.common.loading : t.auth.signUp}
      </Button>
      <p className="text-center text-sm">
        {t.auth.haveAccount} <Link href="/sign-in" className="text-teal-700 underline">{t.auth.signIn}</Link>
      </p>
    </form>
  );
}

export function ForgotForm() {
  const { t } = useI18n();
  const [sent, setSent] = useState(false);
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(z.object({ email: z.email() })) });
  if (sent) return <Alert tone="success">{t.auth.resetSent}</Alert>;
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(async (v) => {
        await authClient.requestPasswordReset({ email: v.email, redirectTo: "/reset-password" });
        setSent(true);
      })}
    >
      <div>
        <Label htmlFor="email">{t.auth.email}</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
      </div>
      <Button type="submit" className="w-full" disabled={formState.isSubmitting}>{t.auth.resetSend}</Button>
    </form>
  );
}

export function ResetForm() {
  const { t } = useI18n();
  const router = useRouter();
  const token = useSearchParams().get("token");
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(z.object({ password: z.string().min(10).max(128) })) });
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(async (v) => {
        if (!token) return setError(t.common.error);
        const r = await authClient.resetPassword({ newPassword: v.password, token });
        if (r.error) return setError(r.error.message ?? t.common.error);
        router.push("/sign-in");
      })}
    >
      {error && <Alert tone="error">{error}</Alert>}
      <div>
        <Label htmlFor="password">{t.auth.newPassword}</Label>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        <FieldHint>{t.auth.passwordHint}</FieldHint>
      </div>
      <Button type="submit" className="w-full" disabled={formState.isSubmitting}>{t.auth.setPassword}</Button>
    </form>
  );
}

export function TwoFactorForm() {
  const { t } = useI18n();
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, formState } = useForm({ resolver: zodResolver(z.object({ code: z.string().regex(/^\d{6}$/) })) });
  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={handleSubmit(async (v) => {
        const r = await authClient.twoFactor.verifyTotp({ code: v.code });
        if (r.error) return setError(r.error.message ?? t.common.error);
        router.push(next);
        router.refresh();
      })}
    >
      {error && <Alert tone="error">{error}</Alert>}
      <div>
        <Label htmlFor="code">{t.auth.totpCode}</Label>
        <Input id="code" inputMode="numeric" autoComplete="one-time-code" maxLength={6} {...register("code")} />
      </div>
      <Button type="submit" className="w-full" disabled={formState.isSubmitting}>{t.auth.verify}</Button>
    </form>
  );
}
