"use client";

import { BankRankingTable } from "@/components/credit-hub/elite/BankRankingTable";
import { useBanksRanking } from "@/lib/credit-hub/hooks/useBanksRanking";
import type { BankRankingRow } from "@/lib/credit-hub/types/analytics";
import type { DataTruthLevel } from "@/lib/credit-hub/honesty/data-truth";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";

const DEMO_BANKS: BankRankingRow[] = [
  { lender_code: "banco_popular_dr", offer_count: 18, approval_rate: 0.52, avg_apr: 0.117, avg_response_hours: 4.2 },
  { lender_code: "banreservas", offer_count: 41, approval_rate: 0.64, avg_apr: 0.113, avg_response_hours: 2.4 },
  { lender_code: "scotiabank_dr", offer_count: 22, approval_rate: 0.58, avg_apr: 0.121, avg_response_hours: 3.1 },
  { lender_code: "banco_bhd", offer_count: 34, approval_rate: 0.71, avg_apr: 0.109, avg_response_hours: 1.8 },
];

export function BankRanking() {
  const query = useBanksRanking();
  const hasReal = !!query.data?.banks?.length && !query.isError;
  const truth: DataTruthLevel = hasReal ? "REAL" : "DEMO";
  const rows = hasReal ? query.data!.banks : DEMO_BANKS;
  const sorted = [...rows].sort((a, b) => (b.approval_rate ?? 0) - (a.approval_rate ?? 0));
  const leader = sorted[0]?.lender_code;

  return (
    <div className="mb-[26px]" data-testid="bank-ranking-section">
      <div className="mb-3">
        <span className="ch-eyebrow" style={{ display: "block", marginBottom: 4 }}>
          A QUIÉN ENVIAR
        </span>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="ch-serif" style={{ margin: 0, fontSize: 19 }}>
            Ranking de bancos para este dealer
          </h2>
          <DataTruthBadge level={truth} />
        </div>
        <p style={{ fontSize: 12, color: "var(--ch-text-3)", marginTop: 4 }}>Tasa, velocidad, APR y volumen de ofertas</p>
      </div>
      {query.isError && !hasReal ? (
        <p style={{ fontSize: 11, color: "var(--ch-text-3)", marginBottom: 8 }}>
          Fallback ilustrativo — conecta banks-ranking en producción.
        </p>
      ) : null}
      <BankRankingTable rows={sorted} truth={truth} leaderCode={leader} showRank />
    </div>
  );
}
