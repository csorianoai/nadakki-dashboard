"use client";

import { SectionHeader } from "@/components/credit-hub/bank/shared/bankUi";

/**
 * B1 — Auction Intelligence (bank dashboard).
 *
 * STATUS: **DEMO** — No auction analytics endpoint exists.
 * [NEEDS-HUMAN: POST endpoint `/analytics/auction-intel` returning win-rate
 *  by score/dealer/amount, lost deals analysis, time-to-offer vs target,
 *  look-to-book ratio.]
 */

interface AuctionMetric {
  label: string;
  value: string;
  sub: string;
}

const DEMO_METRICS: AuctionMetric[] = [
  { label: "Win Rate", value: "34%", sub: "ofertas aceptadas / total enviadas" },
  { label: "Look-to-Book", value: "2.9x", sub: "solicitudes vistas / préstamos cerrados" },
  { label: "Tiempo prom. a oferta", value: "4.2h", sub: "meta: ≤ 3h" },
  { label: "Deals perdidos (30d)", value: "18", sub: "dealer eligió otra entidad" },
];

interface LostDeal {
  reason: string;
  count: number;
  pct: number;
}

const DEMO_LOST: LostDeal[] = [
  { reason: "Tasa más baja en competidor", count: 8, pct: 44 },
  { reason: "Respuesta más rápida", count: 5, pct: 28 },
  { reason: "Mejor plazo ofrecido", count: 3, pct: 17 },
  { reason: "Relación comercial existente", count: 2, pct: 11 },
];

export function AuctionIntel() {
  return (
    <div style={{ marginBottom: 26 }}>
      <SectionHeader
        eyebrow="Inteligencia competitiva"
        title="Subasta — ¿Cómo compites?"
        sub="Visibilidad de tu desempeño vs. otros bancos en la plataforma"
      />

      <div
        style={{
          fontSize: 11,
          color: "var(--ch-text-3)",
          background: "var(--ch-surface-alt, var(--ch-surface))",
          padding: "6px 10px",
          borderRadius: 6,
          marginBottom: 10,
          border: "1px dashed var(--ch-border)",
        }}
      >
        DEMO — Datos ilustrativos. [NEEDS-HUMAN: falta endpoint auction-intel]
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 14 }}>
        {DEMO_METRICS.map((m) => (
          <div key={m.label} className="ch-card" style={{ padding: 14 }}>
            <div className="ch-eyebrow">{m.label}</div>
            <div className="ch-mono" style={{ fontSize: 22, fontWeight: 700, marginTop: 4 }}>
              {m.value}
            </div>
            <div style={{ fontSize: 11, color: "var(--ch-text-3)", marginTop: 4 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="ch-card" style={{ padding: 0 }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ch-line)" }}>
          <div className="ch-card-title">Análisis de deals perdidos</div>
          <div className="ch-card-sub">Razones por las que el dealer eligió otro banco</div>
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--ch-border)" }}>
              <th style={{ textAlign: "left", padding: "8px 16px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ch-text-3)" }}>Razón</th>
              <th style={{ textAlign: "right", padding: "8px 16px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ch-text-3)" }}>Cant.</th>
              <th style={{ textAlign: "right", padding: "8px 16px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ch-text-3)" }}>%</th>
            </tr>
          </thead>
          <tbody>
            {DEMO_LOST.map((d) => (
              <tr key={d.reason} style={{ borderBottom: "1px solid var(--ch-border)" }}>
                <td style={{ padding: "8px 16px" }}>{d.reason}</td>
                <td className="ch-mono" style={{ textAlign: "right", padding: "8px 16px" }}>{d.count}</td>
                <td className="ch-mono" style={{ textAlign: "right", padding: "8px 16px" }}>{d.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
