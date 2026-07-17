/** Concierge AI API with mock fallback. */

import { autosFetch } from "@/lib/autos-consumer-api";
import { matchConciergeReply } from "@/lib/concierge/mock-responses";

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
    if (!res) throw new Error("empty");
    return {
      message: res.reply,
      recId: res.vehicle_id ? Number(res.vehicle_id) : undefined,
      sessionId: res.session_id,
    };
  } catch (error) {
    console.warn("Concierge backend down, using mock", error);
    const mock = matchConciergeReply(query);
    return { message: mock.text, recId: mock.recId };
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
    if (!res) throw new Error("empty");
    return {
      message: res.reply,
      recId: res.vehicle_id ? Number(res.vehicle_id) : undefined,
      sessionId: res.session_id ?? sessionId ?? undefined,
    };
  } catch (error) {
    console.warn("Concierge backend down, using mock", error);
    const mock = matchConciergeReply(message);
    return { message: mock.text, recId: mock.recId };
  }
}
