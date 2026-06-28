"use client";

import type { ReactNode } from "react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { DealerKpiCard } from "@/components/credit-hub/dealer/shared/dealerUi";
import type { DataTruthLevel } from "@/lib/credit-hub/honesty/data-truth";

export function CommandCenterKpi({
  label,
  value,
  unit,
  trendLabel,
  accent,
  truth,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trendLabel?: string;
  accent?: boolean;
  truth: DataTruthLevel;
}) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1 }}>
        <DataTruthBadge level={truth} />
      </div>
      <DealerKpiCard
        label={label}
        value={value}
        unit={unit}
        trendLabel={trendLabel}
        accent={accent}
      />
    </div>
  );
}

export function CommandCenterPanel({
  title,
  sub,
  truth,
  action,
  children,
}: {
  title: string;
  sub?: string;
  truth: DataTruthLevel;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section style={{ marginBottom: 26 }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <h2 className="ch-serif" style={{ margin: 0, fontSize: 19, letterSpacing: "-0.01em" }}>
              {title}
            </h2>
            <DataTruthBadge level={truth} />
          </div>
          {sub ? (
            <div style={{ fontSize: 12.5, color: "var(--ch-text-3)", marginTop: 4 }}>{sub}</div>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
