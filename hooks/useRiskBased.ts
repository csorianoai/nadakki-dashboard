"use client";

import { classifyDealerRiskTier, dealerRiskCopy, readinessScoreExplanation } from "@/lib/credit/risk-based-ux";

export interface UseRiskBasedInput {
  score: number;
}

export interface UseRiskBasedReturn {
  tier: ReturnType<typeof classifyDealerRiskTier>;
  title: string;
  summary: string;
  bullets: string[];
  footer?: string;
  explanationLine: string;
}

export function useRiskBased(config: UseRiskBasedInput): UseRiskBasedReturn {
  const tier = classifyDealerRiskTier(config.score);
  const copy = dealerRiskCopy(tier);
  return {
    tier,
    title: copy.title,
    summary: copy.summary,
    bullets: copy.bullets,
    footer: copy.footer,
    explanationLine: readinessScoreExplanation(config.score, tier),
  };
}
