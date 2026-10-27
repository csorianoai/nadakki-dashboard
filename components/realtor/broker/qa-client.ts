import { apiFetch } from "@/lib/api/fetch-client";
import { BASE_BROKER, type Leida } from "@/lib/realtor/broker/client";
import type { DeskItem } from "@/lib/realtor/broker/types";

/** Rol de /acceso del revisor QA del tenant QA (piloto). No es broker_supervisor. */
export const QA_ROLE = "qa_reviewer";

export type QaEnviar = (ruta: string, init?: RequestInit) => Promise<Response>;
export type QaDecision = "approved" | "returned" | "rejected";
export type QaMotivoFallo = "prohibido" | "no-existe" | "conflicto" | "invalido" | "error";
export type QaDecidida = { estado: "ok"; datos: DeskItem } | { estado: "error"; motivo: QaMotivoFallo };
export type QaEntrada = { decision: QaDecision; reason: string; decided_at: string };

const MOTIVO: Record<number, QaMotivoFallo> = { 403: "prohibido", 404: "no-existe", 409: "conflicto", 422: "invalido" };
const ruta = (id: string, sufijo: string) => `${BASE_BROKER}/items/${encodeURIComponent(id)}/${sufijo}`;

/** POST .../qa-decision. Solo decision y reason: quien decide y el tenant salen del token. Sin efecto legal. */
export async function qaDecidir(id: string, decision: QaDecision, reason: string, enviar: QaEnviar = apiFetch): Promise<QaDecidida> {
  const motivo = reason.trim();
  if (!motivo) return { estado: "error", motivo: "invalido" };
  try {
    const res = await enviar(ruta(id, "qa-decision"), {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ decision, reason: motivo }),
    });
    if (res.status === 200) return { estado: "ok", datos: (await res.json()) as DeskItem };
    return { estado: "error", motivo: MOTIVO[res.status] ?? "error" };
  } catch {
    return { estado: "error", motivo: "error" };
  }
}

/** GET .../qa-history: historial QA del item. 404/503 = vacio. */
export async function qaHistorial(id: string, enviar: QaEnviar = apiFetch): Promise<Leida<readonly QaEntrada[]>> {
  try {
    const res = await enviar(ruta(id, "qa-history"), { method: "GET", cache: "no-store" });
    if (res.status === 404 || res.status === 503) return { estado: "vacio" };
    if (res.status !== 200) return { estado: "error" };
    const cuerpo = (await res.json()) as { entries?: readonly QaEntrada[] } | readonly QaEntrada[];
    const entradas = Array.isArray(cuerpo) ? cuerpo : (cuerpo as { entries?: readonly QaEntrada[] }).entries;
    return { estado: "ok", datos: Array.isArray(entradas) ? entradas : [] };
  } catch {
    return { estado: "error" };
  }
}
