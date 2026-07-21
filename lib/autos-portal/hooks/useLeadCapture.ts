"use client";

import { useCallback } from "react";
import { createFinancingLead } from "@/lib/autos-portal/api";
import type { FinancingLead } from "@/types/autos";

export function useLeadCapture() {
  const captureLead = useCallback(
    async (
      vehicleId: string,
      vehicleData: {
        name: string;
        price: number;
        image: string;
      },
      financingData: {
        requested_amount: number;
        down_payment: number;
        term_months: number;
      },
      creditHubApplicationId?: string,
    ): Promise<FinancingLead> => {
      return createFinancingLead({
        vehicle_id: vehicleId,
        vehicle_data: vehicleData,
        financing_data: financingData,
        credit_hub_application_id: creditHubApplicationId,
      });
    },
    [],
  );

  return { captureLead };
}
