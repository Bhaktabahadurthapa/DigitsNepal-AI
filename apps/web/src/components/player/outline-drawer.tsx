"use client";

import { ListTree } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function OutlineDrawer({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="lg:hidden" aria-label={label}>
          <ListTree aria-hidden /> <span className="hidden sm:inline">{label}</span>
        </Button>
      </DialogTrigger>
      <DialogContent title={label} side="left">
        <div onClickCapture={(e) => (e.target as HTMLElement).closest("a") && setOpen(false)}>{children}</div>
      </DialogContent>
    </Dialog>
  );
}
