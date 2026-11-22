/**
 * DASH-LEGAL L2c: "Análisis de IA no disponible".
 *
 * Contrato de LEGAL-FAILCLOSED-01 (csorianoai/nadakki-ai-suite#1881, services/legal/llm_gate.py),
 * aplicado en POST /api/v1/legal/agents/{id}/run y POST /api/v1/legal/quick-check:
 * - sin modelo: HTTP 503 {"code": "LLM_UNAVAILABLE", "error": "LLM_UNAVAILABLE",
 *   "message", "motivo", "llm_mode": "NONE", "request_id"}
 * - con modelo: 200 con llm_mode "LIVE"
 * - mock (solo fuera de producción): 200 con llm_mode "MOCK" y aviso_mock
 */
import { isMockLlmActive } from "@/lib/legal/content-honesty";

export const LLM_UNAVAILABLE = "LLM_UNAVAILABLE";
export const AI_UNAVAILABLE_TITLE = "Análisis de IA no disponible";
export const AI_UNAVAILABLE_MARKER = `**${AI_UNAVAILABLE_TITLE}**`;

export type AiUnavailableReason = "unavailable" | "mock";

function codeOf(v: unknown): string | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  for (const k of ["code", "error", "error_code"]) {
    if (typeof o[k] === "string") return o[k] as string;
  }
  return null;
}

/**
 * El 503 de la guarda. Formas de error del panel:
 * LegalApiError (lib/api/legal) -> { status, code };
 * APIError (lib/legal-api)      -> { status, error: { detail: <cuerpo> } }.
 */
export function isLlmUnavailable(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const o = e as { status?: unknown; error?: { detail?: unknown } };
  if (o.status !== 503) return false;
  return codeOf(o) === LLM_UNAVAILABLE || codeOf(o.error?.detail) === LLM_UNAVAILABLE;
}

/** 200 con salida simulada: no se presenta como análisis. */
export function isMockOutput(payload: unknown): boolean {
  return isMockLlmActive(payload as Record<string, unknown> | null);
}

export function aiUnavailableText(reason: AiUnavailableReason, avisoMock?: string): string {
  if (reason === "mock") {
    return `Esta respuesta es una salida simulada (MOCK), no un análisis del modelo. No se muestran veredicto, riesgo, confianza ni citas.${avisoMock ? ` ${avisoMock}` : ""}`;
  }
  return "El modelo de lenguaje no está disponible ahora. No se generó ningún análisis: no hay veredicto, riesgo, confianza ni citas.";
}
