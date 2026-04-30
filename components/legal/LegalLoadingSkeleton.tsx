"use client";

import { cn } from "@/lib/utils";

export function LegalLoadingSkeleton({
  variant,
  rows = 5,
}: {
  variant: "card" | "row" | "chat-bubble";
  rows?: number;
}) {
  if (variant === "card") {
    return <div className="h-32 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />;
  }
  if (variant === "chat-bubble") {
    return (
      <div className="space-y-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className={cn("flex", i % 2 === 0 ? "justify-start" : "justify-end")}>
            <div className="h-14 w-2/3 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      ))}
    </div>
  );
}
