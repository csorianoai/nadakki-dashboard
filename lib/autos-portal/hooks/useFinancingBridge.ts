"use client";

import { useCallback } from "react";
import { buildCreditHubPreset, creditHubWizardUrl } from "@/lib/autos-portal/financing-preset";

export type FinancingBridgeResult = {
  applicationId?: string;
  requestedAmount: number;
  creditHubUrl: string;
  fromBackend: boolean;
};

export function useFinancingBridge() {
  const requestFinancing = useCallback(
    async (
      vehicleId: string,
      termMonths: number,
      downPayment: number,
      returnUrl: string,
      vehiclePrice: number,
    ): Promise<FinancingBridgeResult> => {
      const requestedAmount = Math.max(0, vehiclePrice - downPayment);

      const preset = buildCreditHubPreset({
        vehiclePrice,
        downPayment,
        termMonths,
        autosVehicleId: vehicleId,
      });
      const creditHubUrl = `${creditHubWizardUrl(preset)}&return=${encodeURIComponent(returnUrl)}`;

      return {
        applicationId: undefined,
        requestedAmount,
        creditHubUrl,
        fromBackend: false,
      };
    },
    [],
  );

  return { requestFinancing };
}
