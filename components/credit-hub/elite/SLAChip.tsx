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

  const isCritical = critical || minutesRemaining <= 0 || minutesRemaining < 15;
  const isNear = !isCritical && minutesRemaining < 60;
  const label = minutesRemaining <= 0 ? "Vencido" : isCritical ? "Crítico" : isNear ? "Próximo" : "Holgado";
  const timeLabel = minutesRemaining > 0 && isNear ? ` · ${minutesRemaining}m` : minutesRemaining > 0 && !isCritical ? ` · ${Math.floor(minutesRemaining / 60)}h` : "";

  const colors = isCritical
    ? { c: "var(--ch-danger-text)", bg: "var(--ch-danger-soft)" }
    : isNear
      ? { c: "var(--ch-warning-text)", bg: "var(--ch-warning-soft)" }
      : { c: "var(--ch-success-text)", bg: "var(--ch-success-soft)" };

  return (
    <span className="ch-chip" style={{ fontSize: 10, color: colors.c, background: colors.bg }}>
      {label}
      {timeLabel}
    </span>
  );
});
