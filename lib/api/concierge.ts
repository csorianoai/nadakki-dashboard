/** Concierge API: failures never produce inventory recommendations. */

import { autosFetch } from "@/lib/autos-consumer-api";
export class ConciergeUnavailableError extends Error {
  readonly code = "CONCIERGE_UNAVAILABLE";
  constructor() {
    super("No pude consultar el inventario en este momento. Intenta de nuevo en unos minutos.");
    this.name = "ConciergeUnavailableError";
  }
}

export type ConciergeMessageResponse = {
  message: string;
  recId?: number;
  sessionId?: string;
};

export async function conversationalSearch(query: string): Promise<ConciergeMessageResponse> {
  try {
    const res = await autosFetch<{
      reply: string;
      vehicle_id?: string | number;
      session_id?: string;
    }>("/api/v1/autos_ai/conversational_search", {
      method: "POST",
      body: JSON.stringify({ query }),
    });
    if (!res || typeof res.reply !== "string" || !res.reply.trim()) throw new ConciergeUnavailableError();
    return {
      message: res.reply,
      recId: res.vehicle_id && Number.isFinite(Number(res.vehicle_id)) && Number(res.vehicle_id) > 0 ? Number(res.vehicle_id) : undefined,
      sessionId: res.session_id,
    };
  } catch {
    throw new ConciergeUnavailableError();
  }
}

export async function sendConciergeMessage(
  sessionId: string | null,
  message: string,
  context: Record<string, unknown>,
): Promise<ConciergeMessageResponse> {
  try {
    const res = await autosFetch<{
      reply: string;
      vehicle_id?: string | number;
      session_id?: string;
    }>("/api/v1/autos_ai/concierge/message", {
      method: "POST",
      body: JSON.stringify({ session_id: sessionId, message, context }),
    });
    if (!res || typeof res.reply !== "string" || !res.reply.trim()) throw new ConciergeUnavailableError();
    return {
      message: res.reply,
      recId: res.vehicle_id && Number.isFinite(Number(res.vehicle_id)) && Number(res.vehicle_id) > 0 ? Number(res.vehicle_id) : undefined,
      sessionId: res.session_id ?? sessionId ?? undefined,
    };
  } catch {
    throw new ConciergeUnavailableError();
  }
}
