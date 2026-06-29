"use client";

import { memo, type ReactNode } from "react";
import { ArrowDown, ArrowUp, Minus, type LucideIcon } from "lucide-react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import type { DataTruthLevel } from "@/lib/credit-hub/honesty/data-truth";
import { MiniTrend } from "./MiniTrend";

export interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  footnote?: string;
  truth: DataTruthLevel;
  trendValues?: number[];
  trendDemo?: boolean;
  trendColor?: string;
  delta?: { direction: "up" | "down" | "flat"; label: string };
  accent?: boolean;
  icon?: LucideIcon;
  onClick?: () => void;
}

export const MetricCard = memo(function MetricCard({
  label,
  value,
  unit,
  footnote,
  truth,
  trendValues,
  trendDemo = false,
  trendColor,
  delta,
  accent,
  icon: Icon,
  onClick,
}: MetricCardProps) {
  const TrendIcon = delta?.direction === "up" ? ArrowUp : delta?.direction === "down" ? ArrowDown : Minus;
  const deltaColor =
    delta?.direction === "up"
      ? "var(--ch-success-text)"
      : delta?.direction === "down"
        ? "var(--ch-danger-text)"
        : "var(--ch-text-3)";
  const sparkColor = trendColor ?? (accent ? "var(--ch-dealer-accent)" : "var(--ch-text-3)");

  return (
    <div
      className="ch-card flex flex-col"
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      style={{
        padding: "12px 14px 10px",
        position: "relative",
        cursor: onClick ? "pointer" : undefined,
        minHeight: 118,
        borderColor: accent ? "var(--ch-warning-line, var(--ch-persona-soft))" : undefined,
      }}
    >
      <div style={{ position: "absolute", top: 8, right: 8, zIndex: 1 }}>
        <DataTruthBadge level={truth} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
        <div className="ch-eyebrow" style={{ paddingRight: 52, lineHeight: 1.3 }}>
          {label}
        </div>
        {Icon ? (
          <Icon className="h-4 w-4 shrink-0" style={{ color: "var(--ch-text-4)" }} aria-hidden />
        ) : null}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
        <span className="ch-mono" style={{ fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em" }}>
          {value}
        </span>
        {unit ? <span style={{ fontSize: 12, color: "var(--ch-text-3)", fontWeight: 600 }}>{unit}</span> : null}
      </div>
      {delta ? (
        <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: deltaColor, fontWeight: 600, marginBottom: 6 }}>
          <TrendIcon className="h-3 w-3" aria-hidden />
          {delta.label}
        </div>
      ) : footnote ? (
        <div style={{ fontSize: 11, color: "var(--ch-text-3)", marginBottom: 6 }}>{footnote}</div>
      ) : null}
      {(trendValues?.length || trendDemo) ? (
        <div style={{ marginTop: "auto", paddingTop: 4 }}>
          <MiniTrend values={trendValues ?? []} demo={trendDemo} color={sparkColor} height={28} className="w-full" />
        </div>
      ) : null}
    </div>
  );
});
