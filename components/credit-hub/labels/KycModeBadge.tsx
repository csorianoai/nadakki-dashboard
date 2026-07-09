"use client";

import { kycModeBadgeVisual } from "@/lib/credit-hub/labels/pilot-labels";

export interface KycModeBadgeProps {
  value: string | null | undefined;
  className?: string;
  "data-testid"?: string;
}

export function KycModeBadge({ value, className, "data-testid": testId }: KycModeBadgeProps) {
  const visual = kycModeBadgeVisual(value);
  return (
    <span
      data-testid={testId ?? "kyc-mode-badge"}
      data-kyc-mode={value ?? "null"}
      className={className}
      style={{
        display: "inline-flex",
        alignItems: "center",
        padding: "4px 10px",
        borderRadius: 8,
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.03em",
        color: visual.color,
        background: visual.background,
      }}
    >
      {visual.label}
    </span>
  );
}
