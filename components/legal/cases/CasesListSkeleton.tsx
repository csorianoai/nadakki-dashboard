"use client";

import { cn } from "@/lib/utils";

export function CasesListSkeleton() {
  return (
    <ul className="space-y-4" aria-hidden>
      {Array.from({ length: 8 }).map((_, i) => (
        <li
          key={i}
          className={cn(
            "h-[92px] overflow-hidden rounded-2xl border border-zinc-800/85 bg-gradient-to-r from-zinc-900 via-zinc-900/65 to-transparent",
            i % 2 === 0 ? "opacity-100" : "opacity-[0.86]"
          )}
        >
          <div className="h-full animate-pulse bg-gradient-to-br from-transparent via-zinc-800/65 to-transparent" />
        </li>
      ))}
    </ul>
  );
}
