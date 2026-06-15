"use client";

import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmptyStateRichProps } from "@/lib/credit-hub/ch-types";

const toneStyles = {
  default: { bg: "var(--ch-surface-2)", border: "var(--ch-line)", icon: "var(--ch-ink-3)" },
  success: { bg: "var(--ch-pos-soft)", border: "var(--ch-pos)", icon: "var(--ch-pos)" },
  warning: { bg: "var(--ch-warn-soft)", border: "var(--ch-warn)", icon: "var(--ch-warn)" },
} as const;

export function EmptyStateRich({
  title,
  description,
  icon,
  action,
  tone = "default",
  className,
}: EmptyStateRichProps) {
  const palette = toneStyles[tone];

  return (
    <div
      className={cn("ch-card flex flex-col items-center px-6 py-10 text-center", className)}
      style={{ background: palette.bg, borderColor: palette.border }}
    >
      <div className="mb-4" style={{ color: palette.icon }} aria-hidden>
        {icon ?? <Inbox className="h-10 w-10" />}
      </div>
      <h2 className="ch-serif text-lg font-semibold" style={{ color: "var(--ch-ink)" }}>
        {title}
      </h2>
      <p className="mt-2 max-w-md text-sm" style={{ color: "var(--ch-ink-3)" }}>
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
