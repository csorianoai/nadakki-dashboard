"use client";

import { useMemo, useState } from "react";
import { PreApprovalBadge } from "@/components/credit-hub/dealer/wizard/PreApprovalBadge";
import { ForgeButton } from "@/components/credit-hub/primitives/ForgeButton";
import { calculateAmortization } from "@/lib/credit/simulation/amortization";
import type { ScenarioResult } from "@/lib/credit/simulation/scenario-engine";
import type { SimulationInputs } from "@/lib/credit/simulation/scenario-engine";
import type { CreditHubTranslations } from "@/lib/credit-hub/i18n/locales/es-DO/credit-hub";
import { AmortizationChart } from "./AmortizationChart";
import { RecommendationsList } from "./RecommendationsList";

interface Props {
  result: ScenarioResult | null;
  inputs: SimulationInputs;
  copy: CreditHubTranslations["simulator"];
  onSaveScenario: () => void;
  onConvertToApplication?: () => void;
}

function formatDop(n: number): string {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP", maximumFractionDigits: 0 }).format(n);
}

export function SimulatorResults({ result, inputs, copy, onSaveScenario, onConvertToApplication }: Props) {
  const [openDetail, setOpenDetail] = useState(false);
  const amortRows = useMemo(() => {
    if (!result || result.amountToFinance <= 0) return [];
    return calculateAmortization(result.amountToFinance, inputs.annualRate, inputs.termMonths);
  }, [result, inputs.annualRate, inputs.termMonths]);

  if (!result) {
    return (
      <div className="rounded-2xl border border-forge-border bg-forge-surface p-8 text-center text-forge-text-muted">{copy.empty_hint}</div>
    );
  }

  const riskLabel =
    result.riskBand === "BAJO" ? copy.risk_bajo : result.riskBand === "ALTO" ? copy.risk_alto : copy.risk_medio;

  return (
    <div className="space-y-4">
      <h2 className="font-display text-lg font-semibold text-forge-text">{copy.results_title}</h2>
      <PreApprovalBadge result={result} />

      <div className="rounded-xl border border-forge-border bg-forge-surface-elevated/40 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-forge-text-muted">{copy.metrics.approval_probability}</p>
        <div className="h-3 w-full overflow-hidden rounded-full bg-forge-border">
          <div
            className="h-full rounded-full bg-gradient-to-r from-forge-primary to-emerald-400 transition-all"
            style={{ width: `${result.approvalProbability}%` }}
          />
        </div>
        <p className="mt-2 text-right text-sm font-semibold tabular-nums text-forge-text">{result.approvalProbability}%</p>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricCard label={copy.metrics.monthly_installment} value={formatDop(result.estimatedPayment)} />
        <MetricCard label={copy.metrics.dti} value={`${result.dti.toFixed(1)}%`} />
        <MetricCard label={copy.metrics.ltv} value={`${result.ltv.toFixed(1)}%`} />
        <MetricCard label={copy.metrics.capacity} value={formatDop(result.paymentCapacity)} />
      </div>

      <button
        type="button"
        aria-expanded={openDetail}
        onClick={() => setOpenDetail((o) => !o)}
        className="w-full rounded-xl border border-forge-border bg-forge-surface-elevated/50 px-4 py-3 text-left text-sm font-medium text-forge-text hover:bg-forge-surface-elevated"
      >
        {copy.detail_toggle}
        <span className="float-right text-forge-text-muted">{openDetail ? "▲" : "▼"}</span>
      </button>
      {openDetail && (
        <div className="grid grid-cols-1 gap-3 rounded-xl border border-forge-border bg-forge-surface-elevated/30 p-4 sm:grid-cols-2">
          <MetricCard label={copy.metrics.financed} value={formatDop(result.amountToFinance)} />
          <MetricCard label={copy.metrics.total_pay} value={formatDop(result.totalToPay)} />
          <MetricCard label={copy.metrics.total_interest} value={formatDop(result.totalInterest)} />
          <MetricCard label={copy.metrics.gross_roi} value={`${result.grossROI.toFixed(2)}%`} />
          <MetricCard label={copy.metrics.risk_roi} value={`${result.riskAdjustedROI.toFixed(2)}%`} />
          <MetricCard label={copy.metrics.risk_band} value={riskLabel} />
        </div>
      )}

      <AmortizationChart
        rows={amortRows}
        title={copy.chart_title}
        labelBalance={copy.chart_balance}
        labelCumInterest={copy.chart_cum_interest}
        labelCumPrincipal={copy.chart_cum_principal}
      />

      <RecommendationsList items={result.recommendations} heading={copy.recommendations_heading} />

      <div className="flex flex-wrap gap-3">
        <ForgeButton variant="secondary" type="button" onClick={onSaveScenario}>
          {copy.save_scenario}
        </ForgeButton>
        {onConvertToApplication && (
          <ForgeButton variant="primary" type="button" onClick={onConvertToApplication}>
            {copy.convert_application}
          </ForgeButton>
        )}
      </div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-forge-border bg-forge-surface-elevated/40 p-3">
      <p className="text-xs text-forge-text-muted">{label}</p>
      <p className="mt-1 font-semibold tabular-nums text-forge-text">{value}</p>
    </div>
  );
}
