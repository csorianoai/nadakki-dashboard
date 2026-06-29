"use client";

import { memo } from "react";

export const RiskScoreChip = memo(function RiskScoreChip({ score }: { score: number | null | undefined }) {
  if (score == null) {
    return (
      <span className="ch-chip" style={{ fontSize: 10 }}>
        Score —
      </span>
    );
  }
  const band =
    score >= 740 ? "var(--ch-success-soft)" : score >= 670 ? "var(--ch-info-soft)" : score >= 600 ? "var(--ch-warning-soft)" : "var(--ch-danger-soft)";
  const text =
    score >= 740 ? "var(--ch-success-text)" : score >= 670 ? "var(--ch-info-text)" : score >= 600 ? "var(--ch-warning-text)" : "var(--ch-danger-text)";

  return (
    <span className="ch-chip ch-mono" style={{ fontSize: 10, background: band, color: text }}>
      {score}
    </span>
  );
});
