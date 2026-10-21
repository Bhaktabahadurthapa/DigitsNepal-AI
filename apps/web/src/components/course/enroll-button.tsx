"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/client";

export function EnrollButton({ courseId, label }: { courseId: string; label: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const [busy, setBusy] = useState(false);
  return (
    <Button
      size="lg"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const r = await fetch(`/api/courses/${courseId}/enroll`, { method: "POST" });
        if (r.ok) router.push(`/learn/${courseId}`);
        else {
          toast.error(t.common.error);
          setBusy(false);
        }
      }}
    >
      {busy ? t.common.loading : label}
    </Button>
  );
}
