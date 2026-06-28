"use client";

import { useState } from "react";
import { SectionHeader } from "@/components/credit-hub/bank/shared/bankUi";

/**
 * B3 — Segmented Reports (bank dashboard).
 *
 * STATUS: **DEMO** — No segmented analytics endpoint exists.
 * [NEEDS-HUMAN: POST endpoint `/analytics/segmented` accepting
 *  dimension (sector, brand, zone, term, dealer) + period filter,
 *  returning aggregated volume, approval_rate, avg_amount per segment.]
 */

type Dimension = "sector" | "brand" | "zone" | "term" | "dealer";
type Period = "30d" | "90d" | "12m";

interface SegmentRow {
  label: string;
  volume: number;
  approvalRate: number;
  avgAmount: number;
}

const DEMO_DATA: Record<Dimension, SegmentRow[]> = {
  sector: [
    { label: "Asalariado privado", volume: 42, approvalRate: 0.68, avgAmount: 450000 },
    { label: "Asalariado público", volume: 28, approvalRate: 0.74, avgAmount: 380000 },
    { label: "Independiente", volume: 18, approvalRate: 0.52, avgAmount: 520000 },
    { label: "Pensionado", volume: 12, approvalRate: 0.80, avgAmount: 280000 },
  ],
  brand: [
    { label: "Toyota (Nuevo)", volume: 35, approvalRate: 0.72, avgAmount: 680000 },
    { label: "Hyundai (Nuevo)", volume: 22, approvalRate: 0.69, avgAmount: 520000 },
    { label: "Toyota (Usado)", volume: 18, approvalRate: 0.61, avgAmount: 380000 },
    { label: "Kia (Nuevo)", volume: 15, approvalRate: 0.66, avgAmount: 490000 },
    { label: "Otros (Usado)", volume: 10, approvalRate: 0.48, avgAmount: 250000 },
  ],
  zone: [
    { label: "Santo Domingo", volume: 45, approvalRate: 0.67, avgAmount: 520000 },
    { label: "Santiago", volume: 25, approvalRate: 0.70, avgAmount: 480000 },
    { label: "La Romana", volume: 12, approvalRate: 0.62, avgAmount: 420000 },
    { label: "San Cristóbal", volume: 10, approvalRate: 0.58, avgAmount: 350000 },
    { label: "Otras provincias", volume: 8, approvalRate: 0.55, avgAmount: 310000 },
  ],
  term: [
    { label: "24 meses", volume: 8, approvalRate: 0.82, avgAmount: 280000 },
    { label: "36 meses", volume: 22, approvalRate: 0.75, avgAmount: 380000 },
    { label: "48 meses", volume: 35, approvalRate: 0.68, avgAmount: 480000 },
    { label: "60 meses", volume: 28, approvalRate: 0.62, avgAmount: 580000 },
    { label: "72 meses", volume: 7, approvalRate: 0.50, avgAmount: 720000 },
  ],
  dealer: [
    { label: "Auto Dealer Centro", volume: 30, approvalRate: 0.72, avgAmount: 520000 },
    { label: "Premium Motors", volume: 25, approvalRate: 0.68, avgAmount: 680000 },
    { label: "Auto Express RD", volume: 20, approvalRate: 0.64, avgAmount: 420000 },
    { label: "Vehículos del Cibao", volume: 15, approvalRate: 0.70, avgAmount: 460000 },
    { label: "Otros", volume: 10, approvalRate: 0.55, avgAmount: 350000 },
  ],
};

const DIM_LABELS: Record<Dimension, string> = {
  sector: "Sector empleo",
  brand: "Marca / Nuevo-Usado",
  zone: "Zona / Provincia",
  term: "Plazo",
  dealer: "Dealer",
};

const PERIOD_LABELS: Record<Period, string> = {
  "30d": "30 días",
  "90d": "90 días",
  "12m": "12 meses",
};

function fmtMoney(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

export function SegmentedReports() {
  const [dim, setDim] = useState<Dimension>("sector");
  const [period, setPeriod] = useState<Period>("30d");
  const rows = DEMO_DATA[dim];
  const maxVol = Math.max(...rows.map((r) => r.volume));

  return (
    <div style={{ marginBottom: 26 }}>
      <SectionHeader
        eyebrow="Reportes segmentados"
        title="Análisis por segmento"
        sub="Desglose de volumen, aprobación y monto por dimensión"
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
        DEMO — Datos ilustrativos. [NEEDS-HUMAN: falta endpoint /analytics/segmented]
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
        {(Object.keys(DIM_LABELS) as Dimension[]).map((d) => (
          <button
            key={d}
            type="button"
            className="ch-btn ch-btn-sm"
            style={{
              background: d === dim ? "var(--ch-persona)" : "var(--ch-surface)",
              color: d === dim ? "#fff" : "var(--ch-text-2)",
              border: d === dim ? "none" : "1px solid var(--ch-border)",
              fontWeight: d === dim ? 600 : 400,
            }}
            onClick={() => setDim(d)}
          >
            {DIM_LABELS[d]}
          </button>
        ))}
        <span style={{ flex: 1 }} />
        {(Object.keys(PERIOD_LABELS) as Period[]).map((p) => (
          <button
            key={p}
            type="button"
            className="ch-btn ch-btn-sm"
            style={{
              background: p === period ? "var(--ch-text-1)" : "var(--ch-surface)",
              color: p === period ? "#fff" : "var(--ch-text-3)",
              border: p === period ? "none" : "1px solid var(--ch-border)",
              fontSize: 11,
            }}
            onClick={() => setPeriod(p)}
          >
            {PERIOD_LABELS[p]}
          </button>
        ))}
      </div>

      <div className="ch-card" style={{ padding: 0 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--ch-border)" }}>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ch-text-3)" }}>Segmento</th>
              <th style={{ textAlign: "left", padding: "10px 16px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ch-text-3)", minWidth: 120 }}>Volumen</th>
              <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ch-text-3)" }}>Aprob.</th>
              <th style={{ textAlign: "right", padding: "10px 16px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ch-text-3)" }}>Monto prom.</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.label} style={{ borderBottom: "1px solid var(--ch-border)" }}>
                <td style={{ padding: "10px 16px", fontWeight: 500 }}>{r.label}</td>
                <td style={{ padding: "10px 16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ flex: 1, height: 8, background: "var(--ch-surface-3)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{ width: `${(r.volume / maxVol) * 100}%`, height: "100%", background: "var(--ch-persona)", borderRadius: 4 }} />
                    </div>
                    <span className="ch-mono" style={{ fontSize: 12, minWidth: 24, textAlign: "right" }}>{r.volume}</span>
                  </div>
                </td>
                <td className="ch-mono" style={{ textAlign: "right", padding: "10px 16px" }}>{(r.approvalRate * 100).toFixed(0)}%</td>
                <td className="ch-mono" style={{ textAlign: "right", padding: "10px 16px" }}>{fmtMoney(r.avgAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
