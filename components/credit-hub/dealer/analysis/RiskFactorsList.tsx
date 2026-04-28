import { CheckCircle2, XCircle } from "lucide-react";
import type { CreditAnalysisResult } from "@/lib/credit-hub/types/creditAnalysis";

export function RiskFactorsList({ analysis }: { analysis: CreditAnalysisResult }) {
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div className="rounded-2xl border border-forge-success/20 bg-forge-success/5 p-4">
        <h3 className="font-semibold text-forge-success">Factores positivos</h3>
        <ul className="mt-3 space-y-2">
          {analysis.positive_factors.map((factor) => (
            <li key={factor} className="flex items-start gap-2 text-sm text-forge-text">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-forge-success" />
              {factor}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-forge-danger/20 bg-forge-danger/5 p-4">
        <h3 className="font-semibold text-forge-danger">Factores negativos</h3>
        <ul className="mt-3 space-y-2">
          {analysis.negative_factors.length === 0 ? (
            <li className="text-sm text-forge-text-muted">No se detectaron alertas relevantes en las reglas actuales.</li>
          ) : (
            analysis.negative_factors.map((factor) => (
              <li key={factor} className="flex items-start gap-2 text-sm text-forge-text">
                <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-forge-danger" />
                {factor}
              </li>
            ))
          )}
        </ul>
      </div>
    </div>
  );
}
