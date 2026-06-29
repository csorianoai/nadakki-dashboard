"use client";

import { memo } from "react";

export type GoalStatus = "en camino" | "atrasado" | "cumplido";

function statusChip(status: GoalStatus) {
  const styles = {
    "en camino": { bg: "var(--ch-warning-soft)", c: "var(--ch-warning-text)" },
    atrasado: { bg: "var(--ch-danger-soft)", c: "var(--ch-danger-text)" },
    cumplido: { bg: "var(--ch-success-soft)", c: "var(--ch-success-text)" },
  }[status];
  return (
    <span className="ch-chip" style={{ fontSize: 10, background: styles.bg, color: styles.c, textTransform: "lowercase" }}>
      {status}
    </span>
  );
}

export interface GoalCardProps {
  title: string;
  status: GoalStatus;
  currentDisplay: string;
  targetDisplay: string;
  pct: number;
  projectionLine: string;
}

export const GoalCard = memo(function GoalCard({
  title,
  status,
  currentDisplay,
  targetDisplay,
  pct,
  projectionLine,
}: GoalCardProps) {
  const barColor =
    status === "cumplido" ? "var(--ch-success)" : status === "atrasado" ? "var(--ch-danger)" : "var(--ch-warning)";

  return (
    <div className="ch-card ch-card-interactive" style={{ padding: 14 }}>
      <div className="flex justify-between items-start gap-2 mb-2">
        <div style={{ fontSize: 13, fontWeight: 600 }}>{title}</div>
        {statusChip(status)}
      </div>
      <div className="ch-mono" style={{ fontSize: 20, fontWeight: 700 }}>
        {currentDisplay}
        <span style={{ fontSize: 13, color: "var(--ch-text-3)", fontWeight: 500 }}> / meta {targetDisplay}</span>
      </div>
      <div
        style={{
          height: 6,
          background: "var(--ch-surface-3)",
          borderRadius: 3,
          margin: "10px 0 6px",
          overflow: "hidden",
        }}
      >
        <div style={{ width: `${Math.min(pct, 100)}%`, height: "100%", background: barColor, borderRadius: 3 }} />
      </div>
      <div style={{ fontSize: 11, color: "var(--ch-text-3)", borderTop: "1px solid var(--ch-line-subtle)", paddingTop: 8 }}>
        {pct}% avance · {projectionLine}
      </div>
    </div>
  );
});
