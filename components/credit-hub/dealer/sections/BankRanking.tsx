"use client";

import { BankRankingTable } from "@/components/credit-hub/elite/BankRankingTable";
import { CHPanelState } from "@/components/credit-hub/system/CHPanelState";
import { useBanksRanking } from "@/lib/credit-hub/hooks/useBanksRanking";
import { isAnalyticsUnavailable } from "@/lib/credit-hub/hooks/analyticsQueryOptions";
import type { DataTruthLevel } from "@/lib/credit-hub/honesty/data-truth";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";

export function BankRanking() {
  const query = useBanksRanking();
  const unavailable = isAnalyticsUnavailable(query.error);
  const hasReal = !!query.data?.banks?.length && !query.isError;
  const truth: DataTruthLevel = hasReal ? "REAL" : "ROADMAP";
  const rows = hasReal ? query.data!.banks : [];
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

      <CHPanelState
        isLoading={query.isLoading && query.isFetching}
        isError={query.isError && !hasReal && !unavailable}
        isUnavailable={unavailable || (!hasReal && !query.isLoading && !query.isError)}
        unavailableTitle="Ranking por banco no disponible"
        unavailableDescription="El endpoint banks-ranking no devolvió datos. Sin números ilustrativos."
        onRetry={() => void query.refetch()}
        errorTitle="Error al cargar ranking de bancos"
        loadingLabel="Cargando ranking de bancos…"
      >
        {hasReal ? <BankRankingTable rows={sorted} truth={truth} leaderCode={leader} showRank /> : null}
      </CHPanelState>
    </div>
  );
}
