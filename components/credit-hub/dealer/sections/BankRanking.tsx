"use client";

import { DealerSectionHeader } from "@/components/credit-hub/dealer/shared/dealerUi";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";

/**
 * D2 — Bank Ranking "¿A Quién Enviar?" (dealer dashboard).
 *
 * STATUS: **DEMO** — No per-bank analytics endpoint exists. The backend
 * `/analytics/dealers-ranking` returns per-dealer stats, not per-bank.
 * [NEEDS-HUMAN: POST endpoint `/analytics/bank-ranking` that aggregates
 *  approval_rate, avg_apr, avg_time_to_offer, total_offers per lender.]
 *
 * When a real endpoint lands, replace `DEMO_BANKS` with fetched data and
 * remove the DEMO banner.
 */

interface BankRow {
  code: string;
  name: string;
  approvalRate: number;
  avgApr: number;
  avgTimeHours: number;
  totalOffers: number;
}

const DEMO_BANKS: BankRow[] = [
  { code: "banco_popular_dr", name: "Banco Popular Dominicano", approvalRate: 0.72, avgApr: 0.19, avgTimeHours: 18, totalOffers: 12 },
  { code: "banreservas", name: "Banreservas", approvalRate: 0.65, avgApr: 0.215, avgTimeHours: 24, totalOffers: 9 },
  { code: "scotiabank_dr", name: "Scotiabank RD", approvalRate: 0.58, avgApr: 0.175, avgTimeHours: 36, totalOffers: 6 },
  { code: "banco_bhd", name: "BHD León", approvalRate: 0.61, avgApr: 0.20, avgTimeHours: 22, totalOffers: 8 },
];

function pct(n: number): string {
  return `${(n * 100).toFixed(0)}%`;
}

export function BankRanking() {
  const sorted = [...DEMO_BANKS].sort((a, b) => b.approvalRate - a.approvalRate);
  const leader = sorted[0]?.code;

  return (
    <div className="mb-[26px]">
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <DealerSectionHeader title="Ranking de bancos — ¿A quién enviar?" sub="comparativa por desempeño" />
        <DataTruthBadge level="DEMO" />
      </div>

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
        Sin endpoint `/analytics/banks-ranking` aún — datos ilustrativos hasta que el backend lo entregue.
      </div>

      <div className="ch-card" style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--ch-border)" }}>
              <th style={{ textAlign: "left", padding: "10px 12px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ch-text-3)" }}>Banco</th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ch-text-3)" }}>Aprob.</th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ch-text-3)" }}>APR prom.</th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ch-text-3)" }}>Tiempo (h)</th>
              <th style={{ textAlign: "right", padding: "10px 12px", fontWeight: 600, fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--ch-text-3)" }}>Ofertas</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((bank) => (
              <tr key={bank.code} style={{ borderBottom: "1px solid var(--ch-border)" }}>
                <td style={{ padding: "10px 12px", fontWeight: 500 }}>
                  {bank.name}
                  {bank.code === leader ? (
                    <span
                      style={{
                        marginLeft: 8,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: "1px 6px",
                        borderRadius: 4,
                        background: "var(--ch-persona)",
                        color: "#fff",
                        verticalAlign: "middle",
                      }}
                    >
                      LÍDER
                    </span>
                  ) : null}
                </td>
                <td className="ch-mono" style={{ textAlign: "right", padding: "10px 12px" }}>{pct(bank.approvalRate)}</td>
                <td className="ch-mono" style={{ textAlign: "right", padding: "10px 12px" }}>{pct(bank.avgApr)}</td>
                <td className="ch-mono" style={{ textAlign: "right", padding: "10px 12px" }}>{bank.avgTimeHours}h</td>
                <td className="ch-mono" style={{ textAlign: "right", padding: "10px 12px" }}>{bank.totalOffers}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
