"use client";

import { useQuery } from "@tanstack/react-query";
import { chFetch } from "@/lib/credit-hub/api/client";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";

export type KpisPortafolio = { total_applications?: number; accepted_offers?: number; pending_offers?: number; total_approved_amount?: number };
export type KpisAprobacion = { approval_rate_pct?: number; avg_response_hours?: number | null; approved_count?: number; declined_count?: number };

/**
 * Los mismos dos endpoints, cliente y rol que la Mesa actual
 * (getBankExperienceKpis), pero sin convertir lo ausente en 0: un campo que
 * no llega queda undefined y la tarjeta dice "Próximamente".
 */
export function useKpisBanco() {
  const { apiTenantId } = useTenant();
  return useQuery({
    queryKey: ["bank-v2", "kpis", apiTenantId],
    queryFn: async () => {
      const opciones = { tenantId: apiTenantId!, actorRole: "bank_admin" as const };
      const [portafolio, aprobacion] = await Promise.all([
        chFetch<KpisPortafolio>("/api/v2/credit/bank/kpis/portfolio", opciones),
        chFetch<KpisAprobacion>("/api/v2/credit/bank/kpis/approval", opciones),
      ]);
      return { portafolio, aprobacion };
    },
    enabled: !!apiTenantId,
    retry: false,
  });
}
