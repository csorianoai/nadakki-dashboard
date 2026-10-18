import { extractDisplayStatus } from "@/lib/credit-hub/honesty/display-status";
import type { BankReviewPayload } from "@/lib/credit-hub/types/bank-views";
import type { LocaleTenant } from "@/lib/dcc/formato";
import { puntosPorcentuales } from "../comun/formato";
import { RIESGO_TEXTO } from "../mesa/mesa";
import { datosCabecera, textoEstado } from "./expediente";

/**
 * UNA sola fuente por campo para el detalle v2 y para /herramientas (AGENT_CONTRACT §3):
 * ambos pintan estos textos. Campo sin dato en la respuesta del backend: null, y la
 * pantalla dice «Próximamente» con la nota técnica de NOTA_SIN_DATO (la misma en los dos sitios).
 */
export const PROXIMAMENTE = "Próximamente";
export const NOTA_SIN_DATO = {
  tasa: "Falta el campo financial.requested_rate / analysis.metrics.annual_rate en GET /api/v2/credit/applications/{id}",
  plazo: "Falta el campo financial.term_months / analysis.metrics.term_months en GET /api/v2/credit/applications/{id}",
  riesgo: "Falta el campo analysis.risk_level en GET /api/v2/credit/applications/{id}",
} as const;

export function hechosComunes(payload: BankReviewPayload, estadoCola: string | null | undefined, formato: LocaleTenant) {
  const c = datosCabecera(payload);
  const nivel = payload.analysis?.risk_level;
  return {
    estado: textoEstado(extractDisplayStatus(payload.expediente_meta), estadoCola),
    tasa: puntosPorcentuales(c.tasa, formato),
    plazo: c.plazo != null ? c.plazo : null,
    riesgo: nivel != null ? (RIESGO_TEXTO[String(nivel).toUpperCase()] ?? null) : null,
  };
}
