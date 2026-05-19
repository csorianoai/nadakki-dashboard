"use client";

import { useMemo } from "react";
import type { ApplicationHealthData } from "@/lib/credit/app-health-score";
import {
  calculateApplicationHealthScore,
  getHealthScoreFactors,
  getHealthScoreSuggestions,
  getHealthScoreZone,
  type HealthScoreFactorRow,
  type HealthScoreZone,
  type HealthSuggestion,
} from "@/lib/credit/app-health-score";

export interface UseAppHealthScoreConfig {
  applicationId: string;
  tenantId: string;
  applicationData: ApplicationHealthData;
}

export interface UseAppHealthScoreReturn {
  score: number;
  zone: HealthScoreZone;
  factors: HealthScoreFactorRow[];
  suggestions: HealthSuggestion[];
}

/** Derives weighted health score breakdown for overlays and analytics callers. */
export function useAppHealthScore(config: UseAppHealthScoreConfig): UseAppHealthScoreReturn {
  const applicationData = config.applicationData;

  const factors = useMemo(
    () => getHealthScoreFactors(applicationData),
    [applicationData]
  );

  const score = useMemo(() => calculateApplicationHealthScore(applicationData), [applicationData]);

  const zone = useMemo((): HealthScoreZone => getHealthScoreZone(score), [score]);

  const suggestions = useMemo(() => getHealthScoreSuggestions(applicationData), [applicationData]);

  return {
    score,
    zone,
    factors,
    suggestions,
  };
}
