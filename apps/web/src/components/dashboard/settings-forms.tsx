"use client";

import { useRouter } from "next/navigation";
import QRCode from "qrcode";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import { useI18n } from "@/lib/i18n/client";

export function ProfileForm({ name, language }: { name: string; language: "en" | "ne" }) {
  const { t } = useI18n();
  const router = useRouter();
  const [displayName, setName] = useState(name);
  const [lang, setLang] = useState(language);
  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await fetch("/api/me/profile", { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ displayName, preferredLanguage: lang }) });
        if (r.ok) {
          await authClient.updateUser({ name: displayName });
          toast.success(t.common.save);
          router.refresh();
        } else toast.error(t.common.error);
      }}
    >
      <div><Label htmlFor="dn">{t.auth.name}</Label><Input id="dn" value={displayName} onChange={(e) => setName(e.target.value)} minLength={2} maxLength={80} /></div>
      <div>
        <Label htmlFor="pl">{t.nav.language}</Label>
        <Select id="pl" value={lang} onChange={(e) => setLang(e.target.value as "en" | "ne")}><option value="en">English</option><option value="ne">नेपाली</option></Select>
      </div>
      <Button type="submit">{t.common.save}</Button>
    </form>
  );
}

export function EducatorRequest({ rejected }: { rejected: boolean }) {
  const router = useRouter();
  const [statement, setStatement] = useState("");
  return (
    <form
      className="space-y-3"
      onSubmit={async (e) => {
        e.preventDefault();
        const r = await fetch("/api/me/educator-request", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ statement }) });
        if (r.ok) router.refresh();
        else toast.error("Please describe your teaching context in at least 20 characters.");
      }}
    >
      {rejected && <Alert tone="warning">Your previous request was not approved. You may submit a new one.</Alert>}
      <Label htmlFor="st">Tell us where you teach and what you want to create</Label>
      <Textarea id="st" value={statement} onChange={(e) => setStatement(e.target.value)} minLength={20} maxLength={1500} required />
      <Button type="submit">Request educator access</Button>
    </form>
  );
}

export function TwoFactorSetup({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [qr, setQr] = useState<string | null>(null);
  const [backup, setBackup] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (enabled && !qr)
    return (
      <div className="space-y-3">
        <Alert tone="success">Two-factor authentication is enabled.</Alert>
        <form className="flex flex-col gap-2 sm:flex-row" onSubmit={async (e) => {
          e.preventDefault();
          const r = await authClient.twoFactor.disable({ password });
          if (r.error) return setError(r.error.message ?? "Failed");
          router.refresh();
        }}>
          <Input type="password" placeholder="Password" aria-label="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          <Button variant="outline" type="submit">Disable</Button>
        </form>
        {error && <Alert tone="error">{error}</Alert>}
      </div>
    );

  return (
    <div className="space-y-4">
      {error && <Alert tone="error">{error}</Alert>}
      {!qr ? (
        <form className="space-y-3" onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          const r = await authClient.twoFactor.enable({ password });
          if (r.error || !r.data || r.data.method !== "totp") return setError(r.error?.message ?? "Failed");
          setQr(await QRCode.toDataURL(r.data.totpURI));
          setBackup(r.data.backupCodes);
        }}>
          <Label htmlFor="pw">Confirm your password to begin</Label>
          <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
          <Button type="submit">Set up authenticator</Button>
        </form>
      ) : (
        <form className="space-y-3" onSubmit={async (e) => {
          e.preventDefault();
          const r = await authClient.twoFactor.verifyTotp({ code });
          if (r.error) return setError(r.error.message ?? "Invalid code");
          toast.success("Two-factor authentication enabled");
          setQr(null);
          router.refresh();
        }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qr} alt="QR code for your authenticator app" className="size-48 rounded border border-line" />
          <details className="text-sm"><summary className="cursor-pointer">Backup codes (store safely)</summary><ul className="mt-2 grid grid-cols-2 gap-1 font-mono">{backup.map((b) => <li key={b}>{b}</li>)}</ul></details>
          <Label htmlFor="code">Enter the 6-digit code from the app</Label>
          <Input id="code" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} autoComplete="one-time-code" />
          <Button type="submit">Verify and enable</Button>
        </form>
      )}
    </div>
  );
}
