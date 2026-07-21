"use client";

import { useCallback } from "react";
import { createApplication } from "@/lib/api/finance";
import { forgeDealerApplicationDetailHref } from "@/lib/credit-hub/dealerRoutes";

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

      const appResult = await createApplication({
        vehicle_id: vehicleId,
        term_months: termMonths,
        down_payment: downPayment,
        requested_amount: requestedAmount,
        source: "autos_portal_vdp",
        return_url: returnUrl,
      });

      const preset = new URLSearchParams({
        vehicle_id: vehicleId,
        term_months: String(termMonths),
        down_payment: String(downPayment),
        requested_amount: String(requestedAmount),
        return: returnUrl,
      });

      const creditHubUrl = appResult.id
        ? forgeDealerApplicationDetailHref(appResult.id)
        : `/credit-hub/dealer/applications/new/applicant?${preset.toString()}`;

      return {
        applicationId: appResult.id,
        requestedAmount,
        creditHubUrl,
        fromBackend: appResult.fromBackend,
      };
    },
    [],
  );

  return { requestFinancing };
}
