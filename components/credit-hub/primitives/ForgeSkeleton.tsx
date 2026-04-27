import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function ForgeSkeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-forge-shimmer rounded-xl bg-gradient-to-r from-forge-surface via-forge-surface-elevated to-forge-surface bg-[length:200%_100%]",
        className
      )}
      {...props}
    />
  );
}
