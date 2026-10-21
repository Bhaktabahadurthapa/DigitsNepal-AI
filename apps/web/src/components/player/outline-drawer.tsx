"use client";

import { ListTree } from "lucide-react";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function OutlineDrawer({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const sp = useSearchParams();
  useEffect(() => setOpen(false), [path, sp]);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden" aria-label={label}>
          <ListTree aria-hidden /> <span className="hidden sm:inline">{label}</span>
        </Button>
      </DialogTrigger>
      <DialogContent title={label} side="left">{children}</DialogContent>
    </Dialog>
  );
}
