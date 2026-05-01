"use client";

import { motion } from "@/lib/motion-stub";
import { Brain } from "lucide-react";
import { ForgeButton } from "@/components/credit-hub/primitives/ForgeButton";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import { useCreditAnalysis } from "@/lib/credit-hub/hooks/useCreditAnalysis";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { AnalysisDisclaimer } from "./AnalysisDisclaimer";
import { CapacitySnapshot } from "./CapacitySnapshot";
import { PaymentBreakdown } from "./PaymentBreakdown";
import { RecommendationCard } from "./RecommendationCard";
import { RiskFactorsList } from "./RiskFactorsList";
import { ScoreVisual } from "./ScoreVisual";

export function CreditAnalysisPanel({ applicationId }: { applicationId: string }) {
  const t = useTranslations();
  const { data, isLoading, isAnalyzing, error, mutate } = useCreditAnalysis(applicationId);

  return (
    <ForgeCard padding="lg" className="overflow-hidden">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-forge-primary">{t.analysis.panel_kicker}</p>
          <h2 className="mt-1 font-display text-2xl font-bold text-forge-text">{t.analysis.panel_title}</h2>
          <p className="mt-1 text-sm text-forge-text-muted">{t.analysis.panel_subtitle}</p>
        </div>
        <ForgeButton
          variant="primary"
          size="lg"
          onClick={() => mutate()}
          loading={isAnalyzing}
          disabled={isAnalyzing}
          leftIcon={<Brain className="h-5 w-5" />}
          className="bg-gradient-to-br from-forge-primary via-orange-500 to-forge-accent"
        >
          {isAnalyzing ? t.analysis.analyzing : t.analysis.analyze_cta}
        </ForgeButton>
      </div>

      {isAnalyzing && (
        <div className="mt-6 rounded-2xl border border-forge-primary/20 bg-forge-primary/5 p-5">
          <div className="flex items-center gap-3 text-forge-text">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-forge-primary border-t-transparent" />
            {t.analysis.analyzing}
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <div className="h-24 animate-pulse rounded-xl bg-forge-surface-elevated" />
            <div className="h-24 animate-pulse rounded-xl bg-forge-surface-elevated" />
            <div className="h-24 animate-pulse rounded-xl bg-forge-surface-elevated" />
          </div>
        </div>
      )}

      {!isAnalyzing && isLoading && <div className="mt-6 h-48 animate-pulse rounded-2xl bg-forge-surface-elevated" />}

      {!isAnalyzing && error && (
        <div className="mt-6 rounded-2xl border border-forge-danger/30 bg-forge-danger/10 p-5">
          <p className="font-semibold text-forge-danger">{t.analysis.error_title}</p>
          <p className="mt-1 text-sm text-forge-text-muted">{error instanceof Error ? error.message : t.analysis.try_again_detail}</p>
          <ForgeButton className="mt-4" variant="secondary" onClick={() => mutate()}>
            {t.common.retry}
          </ForgeButton>
        </div>
      )}

      {!isLoading && !isAnalyzing && !error && !data && (
        <div className="mt-6 rounded-2xl border border-dashed border-forge-border bg-forge-surface-elevated/60 p-8 text-center">
          <Brain className="mx-auto h-10 w-10 text-forge-primary" />
          <p className="mt-3 font-semibold text-forge-text">{t.analysis.empty_title}</p>
          <p className="mt-1 text-sm text-forge-text-muted">{t.analysis.empty_hint}</p>
        </div>
      )}

      {data && !isAnalyzing && (
        <motion.div
          className="mt-6 space-y-6"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
        >
          <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
            <ScoreVisual analysis={data} />
            <div className="space-y-4">
              <CapacitySnapshot analysis={data} />
              <PaymentBreakdown analysis={data} />
            </div>
          </div>

          <div className="rounded-2xl border border-forge-border bg-forge-surface-elevated p-4">
            <h3 className="font-semibold text-forge-text">{t.analysis.explanation_heading}</h3>
            <p className="mt-2 text-sm leading-relaxed text-forge-text-muted">{data.explanation}</p>
          </div>

          <div>
            <h3 className="mb-3 font-semibold text-forge-text">{t.analysis.recommendations_heading}</h3>
            {data.recommendations.length === 0 ? (
              <p className="rounded-xl bg-forge-success/10 p-4 text-sm text-forge-success">{t.analysis.no_numeric_adjustments}</p>
            ) : (
              <div className="grid gap-3">
                {data.recommendations.map((recommendation) => (
                  <RecommendationCard key={`${recommendation.type}-${recommendation.recommended_value}`} recommendation={recommendation} />
                ))}
              </div>
            )}
          </div>

          <RiskFactorsList analysis={data} />
          <AnalysisDisclaimer />
        </motion.div>
      )}
    </ForgeCard>
  );
}
