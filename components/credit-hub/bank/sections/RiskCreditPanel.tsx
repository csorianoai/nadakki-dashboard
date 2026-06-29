"use client";

import { SectionHeader } from "@/components/credit-hub/bank/shared/bankUi";
import { RiskPortfolioPanel } from "@/components/credit-hub/elite/RiskPortfolioPanel";
import { useRiskDistributions } from "@/lib/credit-hub/hooks/useRiskDistributions";
import type { DistributionBucket, RejectionReasonRow } from "@/lib/credit-hub/types/analytics";

const DEMO_PTI: DistributionBucket[] = [
  { band: "0-20%", count: 3, pct: 35 },
  { band: "20-30%", count: 4, pct: 40 },
  { band: "30-40%", count: 2, pct: 18 },
  { band: "50%+", count: 1, pct: 7 },
];

const DEMO_LTV: DistributionBucket[] = [
  { band: "0-60%", count: 2, pct: 22 },
  { band: "60-70%", count: 4, pct: 45 },
  { band: "70-80%", count: 2, pct: 28 },
  { band: "90%+", count: 1, pct: 5 },
];

const DEMO_REJECTIONS: RejectionReasonRow[] = [
  { reason_code: "RC101_REJECT_CREDIT_POLICY", reason: "Política crediticia", count: 5, pct: 40 },
  { reason_code: "RC102_PTI", reason: "PTI excede límite", count: 3, pct: 24 },
];

export function RiskCreditPanel() {
  const query = useRiskDistributions();
  const hasReal =
    !!query.data &&
    (query.data.pti_distribution.some((b) => b.count > 0) ||
      query.data.ltv_distribution.some((b) => b.count > 0));

  const pti = hasReal ? query.data!.pti_distribution : DEMO_PTI;
  const ltv = hasReal ? query.data!.ltv_distribution : DEMO_LTV;
  const rejections = hasReal && query.data!.rejection_reasons.length ? query.data!.rejection_reasons : DEMO_REJECTIONS;

  return (
    <div style={{ marginBottom: 26 }}>
      <SectionHeader
        eyebrow="Riesgo crediticio"
        title="Análisis de riesgo de la cartera"
        sub="PTI, LTV y razones de rechazo — solo solicitudes asignadas a tu institución"
      />
      {query.isError ? (
        <p style={{ fontSize: 11, color: "var(--ch-text-3)", marginBottom: 8 }}>
          No se pudo cargar risk-distributions — datos ilustrativos (DEMO).
        </p>
      ) : null}
      <RiskPortfolioPanel
        pti={pti}
        ltv={ltv}
        rejections={rejections}
        truth={hasReal ? "REAL" : "DEMO"}
        loading={query.isLoading}
      />
    </div>
  );
}
