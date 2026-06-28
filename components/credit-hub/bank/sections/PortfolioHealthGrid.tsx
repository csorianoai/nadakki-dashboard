"use client";

import { EmptyStateRich } from "@/components/credit-hub/primitives";
import { SectionHeader } from "@/components/credit-hub/bank/shared/bankUi";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { SCORE_BANDS } from "@/lib/credit-hub/bank/bankFormat";
import type { ScoreDistribution } from "@/lib/credit-hub/types/bank-views";
import { Info } from "lucide-react";

export function PortfolioHealthGrid({ distribution }: { distribution?: ScoreDistribution }) {
  const dist = distribution ?? {};
  const distTotal = Object.values(dist).reduce((s, n) => s + (n ?? 0), 0) || 1;

  if (!distribution || Object.keys(distribution).length === 0) {
    return (
      <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <SectionHeader eyebrow="Salud de cartera" title="Distribución por score" />
        <DataTruthBadge level="REAL" />
      </div>
        <EmptyStateRich variant="placeholder" title="Sin distribución" body="El endpoint portfolio-health aún no expone score_distribution para este tenant." />
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
        <SectionHeader eyebrow="Salud de cartera" title="Distribución por score" />
        <DataTruthBadge level="REAL" />
      </div>
      <div className="ch-card" style={{ padding: 18 }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {SCORE_BANDS.map((b) => {
            const n = dist[b.range] ?? 0;
            const pct = (n / distTotal) * 100;
            return (
              <div key={b.range}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5, fontSize: 12 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}>
                    <span style={{ width: 9, height: 9, borderRadius: 2, background: b.color }} />
                    <span className="ch-mono">{b.range}</span>
                    <span style={{ color: "var(--ch-text-3)" }}>· {b.label}</span>
                  </span>
                  <span className="ch-mono" style={{ fontWeight: 600 }}>
                    {n}{" "}
                    <span style={{ color: "var(--ch-text-3)", fontWeight: 400 }}>({pct.toFixed(0)}%)</span>
                  </span>
                </div>
                <div style={{ height: 7, background: "var(--ch-surface-3)", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{ width: `${pct}%`, height: "100%", background: b.color, borderRadius: 4 }} />
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 16, padding: "12px 14px", background: "var(--ch-surface-2)", borderRadius: "var(--ch-r-md)", fontSize: 12, color: "var(--ch-text-3)", lineHeight: 1.5, display: "flex", gap: 9 }}>
          <Info className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          Datos adicionales de salud de cartera disponibles cuando el backend exponga el shape completo de portfolio-health.
        </div>
      </div>
    </div>
  );
}
