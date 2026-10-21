"use client";

import { Flag } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Label, Textarea } from "@/components/ui/input";

export function ReportButton({ courseId }: { courseId: string }) {
  const [open, setOpen] = useState(false);
  const [comment, setComment] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button variant="ghost" size="sm"><Flag aria-hidden /> Report a problem</Button></DialogTrigger>
      <DialogContent title="Report a problem" description="Tell us about incorrect, harmful or inappropriate content. An administrator will review it.">
        <form className="space-y-3" onSubmit={async (e) => {
          e.preventDefault();
          const r = await fetch("/api/reports", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ courseId, kind: "abuse_report", comment }) });
          if (!r.ok) return toast.error("Could not send the report");
          toast.success("Thank you. The report was sent.");
          setComment("");
          setOpen(false);
        }}>
          <Label htmlFor="rc">What is wrong?</Label>
          <Textarea id="rc" value={comment} onChange={(e) => setComment(e.target.value)} minLength={5} maxLength={2000} required />
          <Button type="submit">Send report</Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
