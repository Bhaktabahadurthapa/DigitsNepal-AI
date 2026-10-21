"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export function AddMember({ organizationId }: { organizationId: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("member");
  return (
    <form className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto_auto] sm:items-end" onSubmit={async (e) => {
      e.preventDefault();
      const r = await fetch(`/api/organizations/${organizationId}/members`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, role }) });
      const d = await r.json().catch(() => ({}));
      if (r.status === 200) toast.success("Member added");
      else toast.message(d.message ?? "Request sent");
      setEmail("");
      router.refresh();
    }}>
      <div><Label htmlFor="me">Add member by email</Label><Input id="me" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
      <Select aria-label="Role" value={role} onChange={(e) => setRole(e.target.value)}><option value="member">Member</option><option value="reviewer">Reviewer</option><option value="admin">Admin</option></Select>
      <Button type="submit">Add</Button>
    </form>
  );
}
