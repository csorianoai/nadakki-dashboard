import type { CreditAnalysisResult } from "@/lib/credit-hub/types/creditAnalysis";
import { cn } from "@/lib/utils";
import { formatDop, formatPercent } from "./format";

export function CapacitySnapshot({ analysis }: { analysis: CreditAnalysisResult }) {
  const gap = analysis.payment_capacity - analysis.estimated_payment;
  const dtiWidth = Math.min(100, Math.round(analysis.dti * 100));

  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-xl bg-forge-surface-elevated p-4">
        <p className="text-sm text-forge-text-muted">Capacidad estimada</p>
        <p className="mt-1 font-display text-2xl font-bold text-forge-text">{formatDop(analysis.payment_capacity)}</p>
      </div>
      <div className="rounded-xl bg-forge-surface-elevated p-4">
        <p className="text-sm text-forge-text-muted">Cuota estimada</p>
        <p className="mt-1 font-display text-2xl font-bold text-forge-text">{formatDop(analysis.estimated_payment)}</p>
      </div>
      <div className="rounded-xl bg-forge-surface-elevated p-4">
        <p className="text-sm text-forge-text-muted">Diferencia contra capacidad</p>
        <p className={cn("mt-1 font-display text-2xl font-bold", gap >= 0 ? "text-forge-success" : "text-forge-danger")}>
          {gap >= 0 ? "+" : ""}
          {formatDop(gap)}
        </p>
      </div>
      <div className="rounded-xl bg-forge-surface-elevated p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-forge-text-muted">DTI</span>
          <span className="font-semibold text-forge-text">{formatPercent(analysis.dti)}</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-forge-surface">
          <div
            className={cn("h-full rounded-full", analysis.dti <= 0.45 ? "bg-forge-success" : analysis.dti <= 0.55 ? "bg-forge-warning" : "bg-forge-danger")}
            style={{ width: `${dtiWidth}%` }}
          />
        </div>
      </div>
    </div>
  );
}
