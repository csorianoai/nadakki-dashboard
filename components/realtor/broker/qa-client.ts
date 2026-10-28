import { apiFetch } from "@/lib/api/fetch-client";
import { BASE_BROKER, type Leida } from "@/lib/realtor/broker/client";
import { ACCESS_PATH } from "@/lib/realtor/config";

// Contrato del backend (nadakki-ai-suite): POST .../qa-decision {decision} con extra="forbid" y GET .../qa-decisions
// (routes/real_estate/journey/broker_desk.py, #2463); qa_reviewer de GET /acceso (routes/real_estate/kernel/acceso.py,
// #2473), que sale de la misma regla del servidor que decide qa-decision. Una decision QA no tiene efecto legal.

/** Revisiones que el modo QA puede decidir (services/real_estate/journey/broker_desk/engine.py: REVIEW_KINDS). */
export const QA_KINDS: readonly string[] = ["operation_review", "document_review"];

export type QaEnviar = (ruta: string, init?: RequestInit) => Promise<Response>;
export type QaDecision = "approve" | "return" | "reject";
export type QaMotivoFallo = "prohibido" | "no-existe" | "conflicto" | "invalido" | "error";
export type QaRespuesta = {
  item_id: string; qa_decision: QaDecision; item_status: string; legal_effect: false; test: true;
  qa_decisions?: readonly QaEntrada[];
};
export type QaDecidida = { estado: "ok"; datos: QaRespuesta } | { estado: "error"; motivo: QaMotivoFallo };
export type QaEntrada = { qa_decision: QaDecision; reviewer_user_id: string; at: string };

const MOTIVO: Record<number, QaMotivoFallo> = { 403: "prohibido", 404: "no-existe", 409: "conflicto", 422: "invalido" };
const ruta = (id: string, sufijo: string) => `${BASE_BROKER}/items/${encodeURIComponent(id)}/${sufijo}`;

/** ¿El servidor considera revisor QA a este usuario en este tenant? Solo `qa_reviewer === true`; cualquier otra cosa, no. */
export async function qaEsRevisor(enviar: QaEnviar = apiFetch): Promise<boolean> {
  try {
    const res = await enviar(ACCESS_PATH, { method: "GET", cache: "no-store" });
    if (res.status !== 200) return false;
    const cuerpo = (await res.json()) as { qa_reviewer?: unknown } | null;
    return cuerpo?.qa_reviewer === true;
  } catch {
    return false;
  }
}

/** POST .../qa-decision con SOLO {decision}: quien decide y el tenant salen del token; el backend no admite mas campos. */
export async function qaDecidir(id: string, decision: QaDecision, enviar: QaEnviar = apiFetch): Promise<QaDecidida> {
  try {
    const res = await enviar(ruta(id, "qa-decision"), {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision }),
    });
    if (res.status === 200) return { estado: "ok", datos: (await res.json()) as QaRespuesta };
    return { estado: "error", motivo: MOTIVO[res.status] ?? "error" };
  } catch {
    return { estado: "error", motivo: "error" };
  }
}

/** GET .../qa-decisions: historial QA del item ({qa_decisions: [...]}, la mas reciente primero). 404 = vacio. */
export async function qaHistorial(id: string, enviar: QaEnviar = apiFetch): Promise<Leida<readonly QaEntrada[]>> {
  try {
    const res = await enviar(ruta(id, "qa-decisions"), { method: "GET", cache: "no-store" });
    if (res.status === 404) return { estado: "vacio" };
    if (res.status !== 200) return { estado: "error" };
    const cuerpo = (await res.json()) as { qa_decisions?: unknown } | null;
    return { estado: "ok", datos: Array.isArray(cuerpo?.qa_decisions) ? (cuerpo?.qa_decisions as QaEntrada[]) : [] };
  } catch {
    return { estado: "error" };
  }
}
