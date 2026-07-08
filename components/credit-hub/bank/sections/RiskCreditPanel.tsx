"use client";

import { SectionHeader } from "@/components/credit-hub/bank/shared/bankUi";
import { RiskPortfolioPanel } from "@/components/credit-hub/elite/RiskPortfolioPanel";
import { CHPanelState } from "@/components/credit-hub/system/CHPanelState";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { useRiskDistributions } from "@/lib/credit-hub/hooks/useRiskDistributions";
import { isAnalyticsUnavailable } from "@/lib/credit-hub/hooks/analyticsQueryOptions";
import type { DistributionBucket } from "@/lib/credit-hub/types/analytics";

const SCORE_BANDS = [
  { label: "Super-prime 740+", key: "740-799" },
  { label: "Prime 670–739", key: "670-739" },
  { label: "Near-prime 580–669", key: "580-669" },
  { label: "Sub-prime <580", key: "300-579" },
];

const EMPTY_BUCKETS: DistributionBucket[] = [];

function hasDistributionData(buckets: DistributionBucket[] | undefined): boolean {
  return !!buckets?.some((b) => b.count > 0);
}

export function RiskCreditPanel() {
  const query = useRiskDistributions();
  const unavailable = isAnalyticsUnavailable(query.error);
  const hasRealPtiLtv =
    !!query.data &&
    (hasDistributionData(query.data.pti_distribution) || hasDistributionData(query.data.ltv_distribution));
  const scoreDist = query.data?.score_distribution;
  const hasRealScore =
    !!scoreDist && Object.values(scoreDist).some((count) => Number(count) > 0);

  const pti = hasRealPtiLtv ? query.data!.pti_distribution : EMPTY_BUCKETS;
  const ltv = hasRealPtiLtv ? query.data!.ltv_distribution : EMPTY_BUCKETS;
  const rejections =
    hasRealPtiLtv && query.data!.rejection_reasons.length ? query.data!.rejection_reasons : [];

  return (
    <div style={{ marginBottom: 26 }} data-testid="risk-credit-panel">
      <SectionHeader
        eyebrow="Riesgo y crédito"
        title="Análisis de riesgo de la cartera"
        sub="Adverse action · cumplimiento ECOA / Reg B — solo solicitudes asignadas"
      />

      <CHPanelState
        isLoading={query.isLoading && query.isFetching}
        isUnavailable={unavailable}
        unavailableTitle="Distribuciones PTI/LTV no conectadas"
        loadingLabel="Cargando distribuciones de riesgo…"
      >
        <div className="ch-card overflow-hidden mb-3">
          <div className="ch-card-h">
            <div>
              <div className="ch-card-title">Aprobación por banda de score</div>
              <div className="ch-card-sub">Super-prime → Sub-prime</div>
            </div>
            <DataTruthBadge level={hasRealScore ? "REAL" : "ROADMAP"} />
          </div>
          <div style={{ padding: "12px 16px" }}>
            {hasRealScore ? (
              SCORE_BANDS.map((band) => {
                const count = scoreDist?.[band.key] ?? 0;
                const pct = count > 0 ? Math.min(40 + count * 8, 95) : 0;
                return (
                  <div key={band.key} className="ch-field-row" style={{ alignItems: "center" }}>
                    <span style={{ width: 140, fontSize: 12, color: "var(--ch-text-2)" }}>{band.label}</span>
                    <div style={{ flex: 1, height: 10, background: "var(--ch-surface-3)", borderRadius: 4 }}>
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: "var(--ch-bank-accent, var(--ch-persona))",
                          borderRadius: 4,
                        }}
                      />
                    </div>
                    <span className="ch-mono" style={{ width: 48, textAlign: "right", fontSize: 12, fontWeight: 600 }}>
                      {count}
                    </span>
                  </div>
                );
              })
            ) : (
              <p style={{ fontSize: 12, color: "var(--ch-text-3)", margin: 0 }}>
                Distribución por score no disponible — no usar para decisiones de cartera.
              </p>
            )}
          </div>
        </div>

        {hasRealPtiLtv ? (
          <RiskPortfolioPanel pti={pti} ltv={ltv} rejections={rejections} truth="REAL" loading={false} />
        ) : (
          <p style={{ fontSize: 12, color: "var(--ch-text-3)", margin: 0 }}>
            Distribuciones PTI/LTV y razones de rechazo pendientes de datos del servicio.
          </p>
        )}
      </CHPanelState>
    </div>
  );
}
