import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";
import { cn } from "@/lib/utils";

export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-semibold transition-colors disabled:pointer-events-none disabled:opacity-50 min-h-11 [&_svg]:size-4 [&_svg]:shrink-0 cursor-pointer",
  {
    variants: {
      variant: {
        primary: "bg-teal-700 text-white hover:bg-teal-700/90",
        navy: "bg-navy text-white hover:bg-navy-700",
        outline: "border border-line bg-surface text-ink hover:bg-bg",
        ghost: "text-ink hover:bg-slate-100",
        danger: "bg-red-700 text-white hover:bg-red-700/90",
        link: "text-teal-700 underline-offset-4 hover:underline min-h-0 px-0",
        onDark: "bg-white text-navy hover:bg-white/90",
        outlineOnDark: "border border-white/40 text-white hover:bg-white/10",
      },
      size: {
        sm: "h-9 min-h-9 px-3 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
        icon: "size-11",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({ className, variant, size, asChild, ...props }: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp className={cn(buttonVariants({ variant, size }), className)} {...props} />;
}
