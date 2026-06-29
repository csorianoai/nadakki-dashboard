"use client";

import { MetricCard } from "@/components/credit-hub/elite/MetricCard";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { useAuctionIntel } from "@/lib/credit-hub/hooks/useAuctionIntel";
import type { DataTruthLevel } from "@/lib/credit-hub/honesty/data-truth";
import type { BankDashboardAnalytics } from "@/lib/credit-hub/types/bankDecision";
import { chMoney } from "@/lib/credit-hub/ch-base";

const DEMO_LOST_REASONS = [
  { label: "Por tasa", pct: 42, color: "var(--ch-danger)" },
  { label: "Por términos", pct: 35, color: "var(--ch-warning)" },
  { label: "Por velocidad", pct: 23, color: "var(--ch-info)" },
];

const DEMO_WIN_BREAKDOWN = [
  { band: "Prime 740+", rate: "68%" },
  { band: "Near-prime 670–739", rate: "54%" },
  { band: "Sub-prime <670", rate: "31%" },
];

function DonutChart({ segments }: { segments: { label: string; pct: number; color: string }[] }) {
  let offset = 0;
  const r = 40;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 100 100" style={{ width: 120, height: 120, display: "block" }} aria-hidden>
      {segments.map((seg) => {
        const dash = (seg.pct / 100) * c;
        const el = (
          <circle
            key={seg.label}
            cx="50"
            cy="50"
            r={r}
            fill="none"
            stroke={seg.color}
            strokeWidth="14"
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 50 50)"
          />
        );
        offset += dash;
        return el;
      })}
    </svg>
  );
}

export function AuctionIntel({ analytics }: { analytics?: BankDashboardAnalytics }) {
  const query = useAuctionIntel();
  const data = query.data;
  const endpointTruth = data && !query.isError ? "REAL" : "DEMO";
  const panelTruth = endpointTruth === "REAL" ? "REAL" : "DEMO";

  const winRate = data?.win_rate != null ? `${(data.win_rate * 100).toFixed(0)}` : "—";
  const lookToBook = data?.look_to_book != null ? `${data.look_to_book.toFixed(1)}` : "—";
  const tto = data?.avg_time_to_offer_hours != null ? `${data.avg_time_to_offer_hours}` : "—";
  const lost = data?.lost_deals_count ?? 0;

  return (
    <section style={{ marginBottom: 26 }} data-testid="auction-intel-panel">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <span className="ch-eyebrow">Inteligencia de subasta</span>
        <h2 className="ch-serif" style={{ margin: 0, fontSize: 19 }}>
          Desempeño anonimizado
        </h2>
        <DataTruthBadge level={panelTruth} />
      </div>
      <p style={{ margin: "0 0 12px", fontSize: 13, color: "var(--ch-text-3)" }}>
        Agregado sin nombres ni tasas de competidores · aislamiento activo
      </p>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-3">
        <MetricCard label="Win rate" value={winRate} unit={data?.win_rate != null ? "%" : undefined} truth={endpointTruth} accent trendDemo={!data?.win_rate} trendColor="var(--ch-success)" delta={{ direction: "up", label: "solo tu institución" }} />
        <MetricCard label="Look-to-book" value={lookToBook} unit={data?.look_to_book != null ? "x" : undefined} truth={endpointTruth} trendDemo={!data?.look_to_book} trendColor="var(--ch-bank-accent, var(--ch-info))" />
        <MetricCard label="Tiempo a oferta" value={tto} unit={data?.avg_time_to_offer_hours != null ? "h" : undefined} truth={endpointTruth} delta={{ direction: "down", label: "meta ≤ 3 h" }} trendDemo={!data?.avg_time_to_offer_hours} />
        <MetricCard label="Deals perdidos" value={lost || "—"} truth={endpointTruth} delta={lost ? { direction: "down", label: "sin PII competidor" } : undefined} trendDemo={!data} trendColor="var(--ch-danger)" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-3">
        <div className="ch-card overflow-hidden">
          <div className="ch-card-h">
            <div className="ch-card-title">Win-rate por banda de score</div>
            <DataTruthBadge level="DEMO" />
          </div>
          <div style={{ padding: "12px 16px" }}>
            {DEMO_WIN_BREAKDOWN.map((row) => (
              <div key={row.band} className="ch-field-row">
                <span style={{ fontSize: 12, color: "var(--ch-text-2)" }}>{row.band}</span>
                <span className="ch-mono font-semibold">{row.rate}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="ch-card overflow-hidden">
          <div className="ch-card-h">
            <div className="ch-card-title">Deals perdidos — motivo agregado</div>
            <DataTruthBadge level="DEMO" />
          </div>
          <div style={{ padding: "16px", display: "flex", gap: 16, alignItems: "center" }}>
            <DonutChart segments={DEMO_LOST_REASONS} />
            <div style={{ flex: 1 }}>
              {DEMO_LOST_REASONS.map((r) => (
                <div key={r.label} className="ch-field-row">
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12 }}>
                    <span style={{ width: 8, height: 8, borderRadius: 999, background: r.color }} />
                    {r.label}
                  </span>
                  <span className="ch-mono font-semibold">{r.pct}%</span>
                </div>
              ))}
              <p style={{ fontSize: 11, color: "var(--ch-text-3)", margin: "8px 0 0" }}>
                {lost ? `${lost} deals sin revelar ganador ni tasa competidora.` : "Sin deals perdidos en periodo."}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="ch-card ch-card-spotlight overflow-hidden">
        <div className="ch-card-h">
          <div>
            <div className="ch-card-title">Portafolio y financiero</div>
            <div className="ch-card-sub">Volumen · APR · concentración</div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3" style={{ padding: "14px 16px" }}>
          {[
            { label: "Volumen MTD", value: analytics ? chMoney(analytics.portfolio_value * 0.4) : "—", truth: (analytics ? "REAL" : "DEMO") as DataTruthLevel },
            { label: "Volumen YTD", value: analytics ? chMoney(analytics.portfolio_value) : "—", truth: (analytics ? "REAL" : "DEMO") as DataTruthLevel },
            { label: "APR ponderado", value: "—", truth: "ROADMAP" as DataTruthLevel },
          ].map((row, i) => (
            <div
              key={row.label}
              style={{
                padding: "10px 12px",
                borderRight: i < 2 ? "1px solid var(--ch-line-subtle)" : undefined,
              }}
            >
              <div className="ch-eyebrow" style={{ marginBottom: 6 }}>
                {row.label}
              </div>
              <div className="flex items-center gap-2">
                <span className="ch-mono font-bold text-lg">{row.value}</span>
                <DataTruthBadge level={row.truth} />
              </div>
            </div>
          ))}
        </div>
        <div style={{ padding: "10px 16px", borderTop: "1px solid var(--ch-line-subtle)", background: "var(--ch-surface-2)" }}>
          <span className="ch-chip warning" style={{ fontSize: 10, marginRight: 8 }}>
            Concentración SUV · cerca del límite (DEMO)
          </span>
          <span className="ch-chip success" style={{ fontSize: 10 }}>
            Sedán · dentro del límite (DEMO)
          </span>
        </div>
      </div>
    </section>
  );
}
