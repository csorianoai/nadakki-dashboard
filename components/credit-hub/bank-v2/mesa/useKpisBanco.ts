"use client";

import { useQuery } from "@tanstack/react-query";
import { chFetch } from "@/lib/credit-hub/api/client";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { formatEntero, formatMonedaCompacta, type LocaleTenant } from "@/lib/dcc/formato";
import { porcentaje } from "../comun/formato";

export type KpisPortafolio = { total_applications?: number; accepted_offers?: number; pending_offers?: number; total_approved_amount?: number };
export type KpisAprobacion = { approval_rate_pct?: number; avg_response_hours?: number | null; approved_count?: number; declined_count?: number };

/** Ventana unica de los agregados del banco: las tres pantallas leen la misma. */
export const VENTANA_KPIS = "30d";

/**
 * UNICA fuente de pendientes, aprobadas, tasa, monto aprobado y tiempo medio
 * del banco (Mesa, Indicadores y Analitica). Una sola queryKey y la misma
 * ventana; analytics/dashboard queda solo para top_dealers y cohortes. Lo que
 * no llega queda undefined: nunca se convierte en 0.
 */
export function useKpisBanco() {
  const { apiTenantId } = useTenant();
  return useQuery({
    queryKey: ["bank-v2", "kpis", apiTenantId, VENTANA_KPIS],
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

export type TextosKpis = {
  pendientes: string | null;
  aprobadas: string | null;
  rechazadas: string | null;
  tasa: string | null;
  monto: string | null;
  ofertasAceptadas: string | null;
  tiempoMedio: string | null;
};

/** Mismo formato (comun/formato.ts y moneda del branding) en las tres pantallas; ausente = null. */
export function textosKpis(data: ReturnType<typeof useKpisBanco>["data"], f: LocaleTenant): TextosKpis {
  const p = data?.portafolio;
  const a = data?.aprobacion;
  const horas = a?.avg_response_hours;
  return {
    pendientes: formatEntero(p?.pending_offers, f),
    aprobadas: formatEntero(a?.approved_count, f),
    rechazadas: formatEntero(a?.declined_count, f),
    // El backend da la tasa en puntos (0..100).
    tasa: typeof a?.approval_rate_pct === "number" ? porcentaje(a.approval_rate_pct / 100, f) : null,
    monto: formatMonedaCompacta(p?.total_approved_amount, f),
    ofertasAceptadas: formatEntero(p?.accepted_offers, f),
    tiempoMedio: typeof horas === "number" && Number.isFinite(horas) ? new Intl.NumberFormat(f.locale, { maximumFractionDigits: 1 }).format(horas) : null,
  };
}
