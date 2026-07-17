"use client";

import { cn } from "@/lib/utils";

export function HoverTooltip({
  text,
  children,
  className,
}: {
  text: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("group/tip relative inline-flex", className)}>
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-0 z-50 mb-2 hidden w-[min(240px,calc(100vw-32px))] rounded-lg border border-nk-border bg-nk-surface px-3 py-2 text-left text-[11px] leading-snug text-nk-fg-muted shadow-nk-md group-hover/tip:block group-focus-within/tip:block"
      >
        {text}
      </span>
    </span>
  );
}
