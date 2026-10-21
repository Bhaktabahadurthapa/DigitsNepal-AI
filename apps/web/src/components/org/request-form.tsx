"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select, Textarea } from "@/components/ui/input";

export function OrgRequestForm() {
  const router = useRouter();
  const [f, setF] = useState({ name: "", kind: "school", description: "" });
  return (
    <form className="max-w-xl space-y-4" onSubmit={async (e) => {
      e.preventDefault();
      const r = await fetch("/api/organizations", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(f) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) return toast.error(d.error === "invalid_input" ? "Please complete all fields (description at least 10 characters)." : "Could not submit");
      router.push(`/organizations/${d.id}`);
    }}>
      <div><Label htmlFor="on">Organization name</Label><Input id="on" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} required minLength={3} /></div>
      <div><Label htmlFor="ok">Type</Label><Select id="ok" value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}><option value="school">School</option><option value="nonprofit">Nonprofit</option><option value="other">Other</option></Select></div>
      <div><Label htmlFor="od">What would you like to use DigitsNepal for?</Label><Textarea id="od" value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} required minLength={10} /></div>
      <Button type="submit">Request a workspace</Button>
    </form>
  );
}
