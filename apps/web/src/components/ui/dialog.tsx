"use client";

import { X } from "lucide-react";
import { AlertDialog as AD, Dialog as D } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "./button";

export const Dialog = D.Root;
export const DialogTrigger = D.Trigger;
export const DialogClose = D.Close;

export function DialogContent({
  title,
  description,
  children,
  className,
  side,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** "right" renders a full-height drawer (used for mobile panels). */
  side?: "right" | "left";
}) {
  return (
    <D.Portal>
      <D.Overlay className="fixed inset-0 z-40 bg-navy/50" />
      <D.Content
        className={cn(
          "fixed z-50 flex flex-col gap-4 bg-surface p-6 shadow-xl focus:outline-none",
          side
            ? cn("inset-y-0 w-[min(92vw,420px)] overflow-y-auto", side === "right" ? "right-0" : "left-0")
            : "left-1/2 top-1/2 max-h-[90vh] w-[min(92vw,560px)] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl",
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <D.Title className="text-lg font-semibold">{title}</D.Title>
            {description ? (
              <D.Description className="mt-1 text-sm text-muted">{description}</D.Description>
            ) : (
              <D.Description className="sr-only">{title}</D.Description>
            )}
          </div>
          <D.Close asChild>
            <Button variant="ghost" size="icon" aria-label="Close">
              <X />
            </Button>
          </D.Close>
        </div>
        {children}
      </D.Content>
    </D.Portal>
  );
}

/** Accessible confirmation dialog for destructive or consequential actions. */
export function ConfirmDialog({
  trigger,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  tone = "primary",
  onConfirm,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  tone?: "primary" | "danger";
  onConfirm: () => void | Promise<void>;
}) {
  return (
    <AD.Root>
      <AD.Trigger asChild>{trigger}</AD.Trigger>
      <AD.Portal>
        <AD.Overlay className="fixed inset-0 z-40 bg-navy/50" />
        <AD.Content className="fixed left-1/2 top-1/2 z-50 w-[min(92vw,460px)] -translate-x-1/2 -translate-y-1/2 rounded-xl bg-surface p-6 shadow-xl">
          <AD.Title className="text-lg font-semibold">{title}</AD.Title>
          <AD.Description className="mt-2 text-sm text-muted">{description}</AD.Description>
          <div className="mt-6 flex justify-end gap-2">
            <AD.Cancel asChild>
              <Button variant="outline">{cancelLabel}</Button>
            </AD.Cancel>
            <AD.Action asChild>
              <Button variant={tone === "danger" ? "danger" : "primary"} onClick={() => void onConfirm()}>
                {confirmLabel}
              </Button>
            </AD.Action>
          </div>
        </AD.Content>
      </AD.Portal>
    </AD.Root>
  );
}
