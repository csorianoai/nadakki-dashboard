/** Vehicle-specific chat API. Solo respuestas reales del backend: sin mock local (F-31). */

import { autosFetch } from "@/lib/autos-consumer-api";
import { FEATURE_VEHICLE_CHAT_BACKEND } from "@/lib/autos-agent/feature-flags";
import type { Vehicle } from "@/lib/vehicles";

export type VehicleChatResponse = {
  /** Vacio si no hubo respuesta real. */
  message: string;
  sessionId?: string;
  fromBackend: boolean;
};

export async function sendVehicleChatMessage(
  vehicle: Vehicle,
  message: string,
  sessionId: string | null,
): Promise<VehicleChatResponse> {
  const none: VehicleChatResponse = { message: "", sessionId: sessionId ?? undefined, fromBackend: false };
  if (!FEATURE_VEHICLE_CHAT_BACKEND) return none;
  try {
    const res = await autosFetch<{ reply: string; session_id?: string }>(
      "/api/v1/autos_ai/concierge/message",
      {
        method: "POST",
        body: JSON.stringify({
          session_id: sessionId,
          message,
          vehicle_id: vehicle.refId ?? vehicle.id,
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
    console.warn("Vehicle chat backend failed", error);
  }
  return none;
}
