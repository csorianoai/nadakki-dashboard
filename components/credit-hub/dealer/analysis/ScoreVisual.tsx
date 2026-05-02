"use client";

import { motion } from "@/lib/motion-stub";
import type { CreditAnalysisResult } from "@/lib/credit-hub/types/creditAnalysis";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

const bandLabel: Record<CreditAnalysisResult["approval_band"], string> = {
  PREAPROBABLE: "Preaprobable",
  REQUIERE_AJUSTE: "Requiere ajuste",
  REQUIERE_REVISION: "Requiere revisión",
  NO_RECOMENDADO: "No recomendado",
};

const riskLabel: Record<CreditAnalysisResult["risk_level"], string> = {
  BAJO: "Bajo",
  MEDIO_BAJO: "Medio bajo",
  MEDIO: "Medio",
  ALTO: "Alto",
  MUY_ALTO: "Muy alto",
};

export function ScoreVisual({ analysis }: { analysis: CreditAnalysisResult }) {
  const t = useTranslations();
  const progress = Math.max(0, Math.min(100, analysis.score / 10));
  const ringColor = analysis.score >= 720 ? "text-forge-success" : analysis.score >= 650 ? "text-forge-warning" : analysis.score >= 580 ? "text-orange-500" : "text-forge-danger";
  const bandClass = {
    PREAPROBABLE: "border-forge-success/40 bg-forge-success/10 text-forge-success",
    REQUIERE_AJUSTE: "border-forge-warning/40 bg-forge-warning/10 text-forge-warning",
    REQUIERE_REVISION: "border-orange-500/40 bg-orange-500/10 text-orange-400",
    NO_RECOMENDADO: "border-forge-danger/40 bg-forge-danger/10 text-forge-danger",
  }[analysis.approval_band];

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <div className="relative h-44 w-44">
        <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120" aria-hidden="true">
          <circle cx="60" cy="60" r="52" className="stroke-forge-surface-elevated" strokeWidth="10" fill="none" />
          <motion.circle
            cx="60"
            cy="60"
            r="52"
            className={ringColor}
            stroke="currentColor"
            strokeWidth="10"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${2 * Math.PI * 52}`}
            initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
            animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - progress / 100) }}
            transition={{ duration: 0.9, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs uppercase tracking-[0.2em] text-forge-text-muted">{t.metrics.score_ring_caption}</span>
          <span className="font-display text-5xl font-bold text-forge-text">{analysis.score}</span>
          <span className="text-sm text-forge-text-muted">{t.metrics.out_of_thousand}</span>
        </div>
      </div>
      <div className="flex flex-wrap justify-center gap-2">
        <span className={cn("rounded-full border px-3 py-1 text-sm font-semibold", bandClass)}>
          {bandLabel[analysis.approval_band]}
        </span>
        <span className="rounded-full border border-forge-border bg-forge-surface-elevated px-3 py-1 text-sm text-forge-text">
          {t.metrics.risk}: {riskLabel[analysis.risk_level]}
        </span>
      </div>
    </div>
  );
}
