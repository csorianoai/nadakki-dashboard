import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-nkShimmer rounded-[var(--r-sm,11px)] bg-gradient-to-r from-[var(--surface-2,#F1F5F9)] via-[var(--surface-3,#E9EEF6)] to-[var(--surface-2,#F1F5F9)] bg-[length:460px_100%]",
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
