import type { CreditAnalysisResult } from "@/lib/credit-hub/types/creditAnalysis";
import { formatDop } from "./format";

export function PaymentBreakdown({ analysis }: { analysis: CreditAnalysisResult }) {
  return (
    <div className="grid gap-3 md:grid-cols-3">
      <div className="rounded-xl border border-forge-border bg-forge-surface/60 p-4">
        <p className="text-sm text-forge-text-muted">Monto financiado</p>
        <p className="mt-1 font-semibold text-forge-text">{formatDop(analysis.financed_amount)}</p>
      </div>
      <div className="rounded-xl border border-forge-border bg-forge-surface/60 p-4">
        <p className="text-sm text-forge-text-muted">Capacidad de deuda</p>
        <p className="mt-1 font-semibold text-forge-text">{formatDop(analysis.debt_capacity)}</p>
      </div>
      <div className="rounded-xl border border-forge-border bg-forge-surface/60 p-4">
        <p className="text-sm text-forge-text-muted">Confianza del análisis</p>
        <p className="mt-1 font-semibold text-forge-text">{Math.round(analysis.confidence * 100)}%</p>
      </div>
    </div>
  );
}
