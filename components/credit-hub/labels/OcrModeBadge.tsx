"use client";

import { ocrModeBadgeVisual } from "@/lib/credit-hub/labels/pilot-labels";

export interface OcrModeBadgeProps {
  value: string | null | undefined;
  className?: string;
  "data-testid"?: string;
}

export function OcrModeBadge({ value, className, "data-testid": testId }: OcrModeBadgeProps) {
  const visual = ocrModeBadgeVisual(value);
  return (
    <span
      data-testid={testId ?? "ocr-mode-badge"}
      data-ocr-mode={value ?? "null"}
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
