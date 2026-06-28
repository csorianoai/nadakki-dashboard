"use client";

import { SectionHeader } from "@/components/credit-hub/bank/shared/bankUi";

/**
 * B2 — Risk / Credit Panel (bank dashboard).
 *
 * STATUS: **PARTIAL REAL** for score distribution (via portfolio-health),
 * **DEMO** for PTI distribution, LTV distribution, and rejection reasons.
 *
 * [NEEDS-HUMAN: Extend /analytics/portfolio-health to include:
 *   - pti_distribution (buckets: <28%, 28-36%, 36-43%, >43%)
 *   - ltv_distribution (buckets: <60%, 60-80%, 80-100%, >100%)
 *   - rejection_reasons (top reasons with counts)
 *   - risk_adjusted_yield (net yield after expected defaults)]
 */

interface DistBucket {
  label: string;
  pct: number;
  color: string;
}

const DEMO_PTI: DistBucket[] = [
  { label: "< 28%", pct: 35, color: "#22C55E" },
  { label: "28–36%", pct: 40, color: "#F59E0B" },
  { label: "36–43%", pct: 18, color: "#EF4444" },
  { label: "> 43%", pct: 7, color: "#991B1B" },
];

const DEMO_LTV: DistBucket[] = [
  { label: "< 60%", pct: 22, color: "#22C55E" },
  { label: "60–80%", pct: 45, color: "#3B82F6" },
  { label: "80–100%", pct: 28, color: "#F59E0B" },
  { label: "> 100%", pct: 5, color: "#EF4444" },
];

interface RejectionReason {
  reason: string;
  count: number;
  pct: number;
}

const DEMO_REJECTIONS: RejectionReason[] = [
  { reason: "PTI excede límite (43%)", count: 14, pct: 32 },
  { reason: "Score < 600", count: 11, pct: 25 },
  { reason: "Historial crediticio insuficiente", count: 8, pct: 18 },
  { reason: "Ingreso no verificable", count: 6, pct: 14 },
  { reason: "Colateral insuficiente (LTV > 100%)", count: 5, pct: 11 },
];

function HorizontalBar({ buckets, title }: { buckets: DistBucket[]; title: string }) {
  return (
    <div className="ch-card" style={{ padding: 16 }}>
      <div className="ch-card-title" style={{ marginBottom: 12 }}>{title}</div>
      <div style={{ display: "flex", height: 18, borderRadius: 6, overflow: "hidden", marginBottom: 10 }}>
        {buckets.map((b) => (
          <div key={b.label} style={{ width: `${b.pct}%`, background: b.color, minWidth: b.pct > 0 ? 4 : 0 }} title={`${b.label}: ${b.pct}%`} />
        ))}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 16px", fontSize: 12 }}>
        {buckets.map((b) => (
          <span key={b.label} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: b.color }} />
            <span className="ch-mono">{b.label}</span>
            <span style={{ color: "var(--ch-text-3)" }}>{b.pct}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function RiskCreditPanel() {
  return (
    <div style={{ marginBottom: 26 }}>
      <SectionHeader
        eyebrow="Riesgo crediticio"
        title="Análisis de riesgo de la cartera"
        sub="PTI, LTV y razones de rechazo — Reg B / ECOA relevante"
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
        DEMO — Distribuciones PTI/LTV y razones de rechazo son ilustrativas. [NEEDS-HUMAN: extender portfolio-health endpoint]
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
        <HorizontalBar buckets={DEMO_PTI} title="Distribución PTI (Payment-to-Income)" />
        <HorizontalBar buckets={DEMO_LTV} title="Distribución LTV (Loan-to-Value)" />
      </div>

      <div className="ch-card" style={{ padding: 0 }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--ch-line)" }}>
          <div className="ch-card-title">Razones de rechazo (Top 5)</div>
          <div className="ch-card-sub">Compliance: razones deben ser documentables bajo Reg B / ECOA</div>
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
            {DEMO_REJECTIONS.map((r) => (
              <tr key={r.reason} style={{ borderBottom: "1px solid var(--ch-border)" }}>
                <td style={{ padding: "8px 16px" }}>{r.reason}</td>
                <td className="ch-mono" style={{ textAlign: "right", padding: "8px 16px" }}>{r.count}</td>
                <td className="ch-mono" style={{ textAlign: "right", padding: "8px 16px" }}>{r.pct}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
