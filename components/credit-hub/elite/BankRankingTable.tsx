"use client";

import { memo } from "react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import type { DataTruthLevel } from "@/lib/credit-hub/honesty/data-truth";
import type { BankRankingRow } from "@/lib/credit-hub/types/analytics";
import { computeBankFitScore, lenderDisplayName } from "@/lib/credit-hub/dealer/lender-display";

function pct(n: number | null | undefined): string {
  if (n == null) return "—";
  return `${(n < 1 ? n * 100 : n).toFixed(0)}%`;
}

export interface BankRankingTableProps {
  rows: BankRankingRow[];
  truth: DataTruthLevel;
  leaderCode?: string;
  showRank?: boolean;
}

function bankInitials(code: string, name: string): string {
  const words = name.split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0]![0]! + words[1]![0]!).toUpperCase();
  return code.slice(0, 2).toUpperCase();
}

export const BankRankingTable = memo(function BankRankingTable({ rows, truth, leaderCode, showRank }: BankRankingTableProps) {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <DataTruthBadge level={truth} />
      </div>
      <div className="ch-card overflow-x-auto">
        <table className="ch-table min-w-[520px]">
          <thead>
            <tr>
              {showRank ? <th style={{ width: 36 }}>#</th> : null}
              <th>Banco</th>
              <th className="ch-num">Tasa aprob.</th>
              <th className="ch-num">Tiempo a oferta</th>
              <th className="ch-num">APR prom.</th>
              <th className="ch-num">Ofertas</th>
              {showRank ? null : <th className="ch-num">Fit</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((bank, index) => {
              const fit = computeBankFitScore(bank);
              const isLeader = leaderCode === bank.lender_code;
              const displayName = lenderDisplayName(bank.lender_code, bank.lender_display_name);
              return (
                <tr key={bank.lender_code}>
                  {showRank ? <td className="ch-mono" style={{ color: "var(--ch-text-3)" }}>{index + 1}</td> : null}
                  <td style={{ fontWeight: 600 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 999,
                          background: "var(--ch-dealer-accent-soft, var(--ch-persona-soft))",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {bankInitials(bank.lender_code, displayName)}
                      </span>
                      {displayName}
                      {isLeader ? (
                        <span className="ch-chip" style={{ fontSize: 10 }}>
                          líder
                        </span>
                      ) : null}
                    </span>
                  </td>
                  <td className="ch-num">{pct(bank.approval_rate)}</td>
                  <td className="ch-num">{bank.avg_response_hours != null ? `${bank.avg_response_hours}h` : "—"}</td>
                  <td className="ch-num">{pct(bank.avg_apr)}</td>
                  <td className="ch-num">{bank.offer_count}</td>
                  {showRank ? null : (
                    <td className="ch-num">
                      <span title="Combinación de aprobación, velocidad y volumen">{fit}</span>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
