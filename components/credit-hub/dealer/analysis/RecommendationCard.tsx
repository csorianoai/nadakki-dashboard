"use client";

import { ArrowRight } from "lucide-react";
import type { CreditAnalysisRecommendation } from "@/lib/credit-hub/types/creditAnalysis";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { formatDop, formatPercent } from "./format";

function formatRecommendationValue(type: string, value: number): string {
  if (type === "extend_term") return `${Math.round(value)} meses`;
  if (type === "add_guarantor") return value > 0 ? "Agregar garante" : "Sin garante";
  return formatDop(value);
}

export function RecommendationCard({ recommendation }: { recommendation: CreditAnalysisRecommendation }) {
  const t = useTranslations();
  return (
    <article className="rounded-2xl border border-forge-border bg-forge-surface-elevated p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="font-semibold text-forge-text">{recommendation.title}</h4>
          <p className="mt-1 text-sm text-forge-text-muted">{recommendation.explanation}</p>
        </div>
        <span className="rounded-full bg-forge-primary/10 px-3 py-1 text-xs font-semibold text-forge-primary">
          {t.metrics.score_short} {recommendation.estimated_new_score}
        </span>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
        <span className="rounded-lg bg-forge-surface px-3 py-2 text-forge-text">
          {formatRecommendationValue(recommendation.type, recommendation.current_value)}
        </span>
        <ArrowRight className="h-4 w-4 text-forge-text-muted" />
        <span className="rounded-lg bg-forge-primary/10 px-3 py-2 font-semibold text-forge-primary">
          {formatRecommendationValue(recommendation.type, recommendation.recommended_value)}
        </span>
      </div>
      <div className="mt-4 grid gap-2 text-sm md:grid-cols-2">
        <p className="text-forge-text-muted">
          Nueva cuota: <span className="font-semibold text-forge-text">{formatDop(recommendation.estimated_new_payment)}</span>
        </p>
        <p className="text-forge-text-muted">
          {t.metrics.new_dti}: <span className="font-semibold text-forge-text">{formatPercent(recommendation.estimated_new_dti)}</span>
        </p>
      </div>
      <p className="mt-3 text-sm text-forge-success">{recommendation.impact}</p>
    </article>
  );
}
