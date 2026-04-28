"use client";

import { useMemo } from "react";
import { useTenantConfig } from "./useTenantConfig";
import { calculateScenario, type ScenarioResult, type SimulationInputs } from "@/lib/credit/simulation/scenario-engine";

export type { SimulationInputs, ScenarioResult } from "@/lib/credit/simulation/scenario-engine";

export function usePreApprovalSimulation(inputs: SimulationInputs | null): ScenarioResult | null {
  const { tenantConfig } = useTenantConfig();

  return useMemo(() => {
    if (!inputs) return null;

    const dtiMax = (tenantConfig.dti_max ?? 0.4) * 100;
    const dtiWarningRatio = tenantConfig.dti_warning_ratio ?? 0.85;
    const ltvMax = (tenantConfig.ltv_max ?? 0.95) * 100;
    const minRoiThreshold = tenantConfig.min_roi_threshold ?? 30;
    const riskMultipliers = tenantConfig.risk_multipliers ?? { BAJO: 1.0, MEDIO: 0.75, ALTO: 0.5 };
    const paymentCapacityRatio = tenantConfig.payment_capacity_ratio ?? 0.4;
    const maxTermMonths = Math.max(...(tenantConfig.allowed_terms?.length ? tenantConfig.allowed_terms : [84]));

    return calculateScenario({
      ...inputs,
      dtiMax,
      dtiWarningRatio,
      ltvMax,
      minRoiThreshold,
      riskMultipliers,
      paymentCapacityRatio,
      maxTermMonths,
    });
  }, [inputs, tenantConfig]);
}
