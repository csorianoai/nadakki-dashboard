"use client";

import { dataSourceBadgeVisual } from "@/lib/credit-hub/labels/pilot-labels";

export interface CreditDataSourceBadgeProps {
  /** Backend `data_source_label`; null → "Estado desconocido" (never assumes LIVE). */
  value: string | null | undefined;
  className?: string;
  "data-testid"?: string;
}

export function CreditDataSourceBadge({ value, className, "data-testid": testId }: CreditDataSourceBadgeProps) {
  const visual = dataSourceBadgeVisual(value);
  return (
    <span
      data-testid={testId ?? "credit-data-source-badge"}
      data-source-label={value ?? "null"}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "4px 10px",
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: visual.color,
        background: visual.background,
      }}
    >
      {visual.icon ? <span aria-hidden>{visual.icon}</span> : null}
      {visual.label}
    </span>
  );
}
