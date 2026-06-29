"use client";

import { memo } from "react";

export const SLAChip = memo(function SLAChip({
  minutesRemaining,
  critical = false,
}: {
  minutesRemaining: number | null;
  critical?: boolean;
}) {
  if (minutesRemaining == null) {
    return (
      <span className="ch-chip" style={{ fontSize: 10 }}>
        SLA —
      </span>
    );
  }
  const label = minutesRemaining <= 0 ? "SLA vencido" : minutesRemaining < 15 ? "SLA crítico" : `${minutesRemaining}m`;
  return (
    <span
      className="ch-chip"
      style={{
        fontSize: 10,
        color: critical || minutesRemaining < 15 ? "var(--ch-danger-text)" : "var(--ch-warning-text)",
        background: critical || minutesRemaining < 15 ? "var(--ch-danger-soft)" : "var(--ch-warning-soft)",
      }}
    >
      {label}
    </span>
  );
});
