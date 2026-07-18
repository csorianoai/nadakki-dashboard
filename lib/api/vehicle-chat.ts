/** Vehicle-specific chat API — extends concierge pattern, Fase 8. */

import { autosFetch } from "@/lib/autos-consumer-api";
import { sendConciergeMessage } from "@/lib/api/concierge";
import { demoDelay } from "@/lib/autos-agent/demo-delay";
import { FEATURE_VEHICLE_CHAT_BACKEND } from "@/lib/autos-agent/feature-flags";
import { matchVehicleChatReply } from "@/lib/vehicle-chat/mock-responses";
import type { Vehicle } from "@/lib/vehicles";

export type VehicleChatResponse = {
  message: string;
  sessionId?: string;
  fromBackend: boolean;
};

export async function sendVehicleChatMessage(
  vehicle: Vehicle,
  message: string,
  sessionId: string | null,
): Promise<VehicleChatResponse> {
  if (FEATURE_VEHICLE_CHAT_BACKEND) {
    try {
      const res = await autosFetch<{ reply: string; session_id?: string }>(
        "/api/v1/autos_ai/concierge/message",
        {
          method: "POST",
          body: JSON.stringify({
            session_id: sessionId,
            message,
            vehicle_id: vehicle.id,
            context: {
              make: vehicle.make,
              model: vehicle.model,
              year: vehicle.year,
              price: vehicle.price,
              dealer: vehicle.dealerName,
            },
          }),
        },
      );
      if (res?.reply) {
        return { message: res.reply, sessionId: res.session_id ?? sessionId ?? undefined, fromBackend: true };
      }
    } catch (error) {
      console.warn("Vehicle chat backend failed, using mock", error);
    }
  }

  try {
    const fallback = await sendConciergeMessage(sessionId, message, {
      vehicle_id: vehicle.id,
    });
    if (fallback.message && !fallback.message.includes("demo")) {
      return { message: fallback.message, sessionId: fallback.sessionId, fromBackend: false };
    }
  } catch {
    /* use local mock */
  }

  await demoDelay();
  return {
    message: matchVehicleChatReply(message, vehicle),
    sessionId: sessionId ?? `vchat-${vehicle.id}-${Date.now()}`,
    fromBackend: false,
  };
}
