"use client";

import { SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";

export function FiltersFab({
  count,
  onClick,
  className,
}: {
  count: number;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "fixed bottom-5 left-5 z-40 inline-flex items-center gap-2 rounded-full border border-nk-border bg-nk-surface px-4 py-3 text-sm font-semibold text-nk-fg shadow-nk-lg transition hover:-translate-y-0.5 md:hidden",
        className,
      )}
    >
      <SlidersHorizontal className="h-4 w-4 text-brand" aria-hidden />
      Filtros ({count})
      {count > 0 ? (
        <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-[var(--on-brand)]">
          {count}
        </span>
      ) : null}
    </button>
  );
}
