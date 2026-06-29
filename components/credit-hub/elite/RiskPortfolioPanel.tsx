"use client";

import { memo } from "react";
import { bucketColor } from "./MiniTrend";
import type { DistributionBucket, RejectionReasonRow } from "@/lib/credit-hub/types/analytics";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import type { DataTruthLevel } from "@/lib/credit-hub/honesty/data-truth";

function HorizontalBar({ buckets, title }: { buckets: DistributionBucket[]; title: string }) {
  return (
    <div className="ch-card" style={{ padding: 16 }}>
      <div className="ch-card-title" style={{ marginBottom: 12 }}>
        {title}
      </div>
      <div style={{ display: "flex", height: 18, borderRadius: 6, overflow: "hidden", marginBottom: 10 }}>
        {buckets.map((b, i) => (
          <div
            key={b.band}
            style={{
              width: `${Math.max(b.pct, b.count > 0 ? 2 : 0)}%`,
              background: bucketColor(i),
              minWidth: b.count > 0 ? 4 : 0,
            }}
            title={`${b.band}: ${b.pct.toFixed(1)}%`}
          />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: 12 }}>
        {buckets.map((b, i) => (
          <span key={b.band} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: bucketColor(i) }} />
            <span className="ch-mono">{b.band}</span>
            <span style={{ color: "var(--ch-text-3)" }}>{b.count}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export interface RiskPortfolioPanelProps {
  pti: DistributionBucket[];
  ltv: DistributionBucket[];
  rejections: RejectionReasonRow[];
  truth: DataTruthLevel;
  loading?: boolean;
}

export const RiskPortfolioPanel = memo(function RiskPortfolioPanel({
  pti,
  ltv,
  rejections,
  truth,
  loading,
}: RiskPortfolioPanelProps) {
  if (loading) {
    return <div className="ch-card p-4 animate-pulse" style={{ height: 120 }} aria-busy="true" />;
  }

  return (
    <div data-testid="risk-portfolio-panel">
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <DataTruthBadge level={truth} />
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 mb-3">
        <HorizontalBar buckets={pti} title="Distribución PTI" />
        <HorizontalBar buckets={ltv} title="Distribución LTV" />
      </div>
      <div className="ch-card overflow-hidden">
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ch-line)" }}>
          <div className="ch-card-title">Razones de rechazo</div>
          <div className="ch-card-sub">Reg B / ECOA — solo tu cartera asignada</div>
        </div>
        <table className="ch-table">
          <thead>
            <tr>
              <th>Razón</th>
              <th className="ch-num">Cant.</th>
              <th className="ch-num">%</th>
            </tr>
          </thead>
          <tbody>
            {rejections.slice(0, 8).map((r) => (
              <tr key={r.reason_code}>
                <td>{r.reason ?? r.reason_code}</td>
                <td className="ch-num">{r.count}</td>
                <td className="ch-num">{r.pct.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
