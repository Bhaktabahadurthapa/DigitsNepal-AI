import * as React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, caption, children, ...props }: React.ComponentProps<"table"> & { caption?: string }) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-line bg-surface">
      <table className={cn("w-full text-left text-sm", className)} {...props}>
        {caption && <caption className="sr-only">{caption}</caption>}
        {children}
      </table>
    </div>
  );
}
export const THead = (p: React.ComponentProps<"thead">) => <thead className="border-b border-line bg-bg text-xs uppercase tracking-wide text-muted" {...p} />;
export const TBody = (p: React.ComponentProps<"tbody">) => <tbody className="divide-y divide-line" {...p} />;
export const TR = (p: React.ComponentProps<"tr">) => <tr className="hover:bg-bg/60" {...p} />;
export const TH = ({ className, ...p }: React.ComponentProps<"th">) => <th scope="col" className={cn("px-4 py-3 font-semibold", className)} {...p} />;
export const TD = ({ className, ...p }: React.ComponentProps<"td">) => <td className={cn("px-4 py-3 align-middle", className)} {...p} />;
