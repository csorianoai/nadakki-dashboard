"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiFetch } from "@/lib/api/fetch-client";
import type { ResumenInsights } from "./contrato";

export const RUTA_RESUMEN = "/api/v1/marketing/insights/summary";
const STALE_MS = 60_000;

/** Error de la peticion con el codigo HTTP y el `detail` estable del backend (insufficient_role, account_not_found, invalid_range...). */
export class ErrorInsights extends Error {
  constructor(readonly status: number, readonly codigo: string | null) {
    super(`insights/summary ${status}${codigo ? ` ${codigo}` : ""}`);
    this.name = "ErrorInsights";
  }
}

export interface ParametrosResumen {
  from: string;
  to: string;
  customerId?: string | null;
}

export function urlResumen(p: ParametrosResumen): string {
  const q = new URLSearchParams({ from: p.from, to: p.to, compare: "previous_period" });
  if (p.customerId) q.set("customer_id", p.customerId);
  return `${RUTA_RESUMEN}?${q.toString()}`;
}

async function codigoDe(res: Response): Promise<string | null> {
  try {
    const body = (await res.json()) as { detail?: unknown };
    const d = body?.detail;
    if (typeof d === "string") return d;
    if (d && typeof d === "object" && typeof (d as { code?: unknown }).code === "string") return (d as { code: string }).code;
  } catch {
    /* cuerpo no JSON */
  }
  return null;
}

/** Una sola peticion; sin X-Tenant-ID (el tenant sale del token). Lanza ErrorInsights ante cualquier no-200. */
export async function pedirResumen(p: ParametrosResumen, fetcher: typeof apiFetch = apiFetch): Promise<ResumenInsights> {
  const res = await fetcher(urlResumen(p), { headers: { Accept: "application/json" } });
  if (!res.ok) throw new ErrorInsights(res.status, await codigoDe(res));
  return (await res.json()) as ResumenInsights;
}

/** Los 4xx son definitivos (rol, cuenta, rango): no se reintentan. Los 5xx y la red, una vez. */
export function reintentar(intento: number, error: unknown): boolean {
  if (error instanceof ErrorInsights && error.status >= 400 && error.status < 500) return false;
  return intento < 1;
}

export function useResumenInsights(p: ParametrosResumen | null) {
  const { tenant } = useAuth();
  return useQuery<ResumenInsights, Error>({
    queryKey: ["command-center-insights", tenant?.id ?? tenant?.slug ?? "", p?.from ?? "", p?.to ?? "", p?.customerId ?? ""],
    queryFn: () => pedirResumen(p as ParametrosResumen),
    enabled: p !== null,
    staleTime: STALE_MS,
    refetchOnWindowFocus: false,
    retry: reintentar,
  });
}
