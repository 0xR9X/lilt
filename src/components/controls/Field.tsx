import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Field({
  label,
  inline,
  compact,
  children,
}: {
  label: string;
  inline?: boolean;
  compact?: boolean;
  children: ReactNode;
}) {
  return (
    <label
      className={cn(
        "flex min-w-0 flex-col gap-2 text-xs",
        inline && "flex-row items-center gap-3 text-muted-foreground",
      )}
    >
      <span className={cn(compact && "max-sm:hidden")}>{label}</span>
      {children}
    </label>
  );
}
