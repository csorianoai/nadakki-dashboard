/** Contextual vehicle chat mock responses — Fase 8. */

import type { Vehicle } from "@/lib/vehicles";
import { fmtKm, fmtRD } from "@/lib/format";
import { cuota } from "@/lib/finance";

export function matchVehicleChatReply(
  message: string,
  vehicle: Vehicle,
): string {
  const lower = message.toLowerCase();
  const monthly = Math.round(cuota(vehicle.price, 20, 60));

  if (/disponib|stock|todav/i.test(lower)) {
    return `Sí, este ${vehicle.year} ${vehicle.make} ${vehicle.model} está disponible en ${vehicle.dealerName}. Última actualización hace pocas horas. ¿Te gustaría agendar un test drive?`;
  }
  if (/trade|permut|intercamb/i.test(lower)) {
    return `${vehicle.dealerName} acepta trade-in. Envía fotos y datos de tu vehículo actual y te damos una estimación en 24h. Este ${vehicle.make} califica para financiamiento con inicial desde 20%.`;
  }
  if (/historial|dgii|verific/i.test(lower)) {
    return vehicle.verified
      ? `Este vehículo tiene historial verificado DGII ✓. ${vehicle.km.toLocaleString("en-US")} km reportados, sin alertas de gravamen. ${vehicle.dealerName} responde en ~${vehicle.avgResp}.`
      : `Estamos verificando el historial completo. Kilometraje reportado: ${fmtKm(vehicle.km)}. ${vehicle.dealerName} puede compartir el reporte en persona.`;
  }
  if (/test|prueba|manejar|agendar/i.test(lower)) {
    return `¡Perfecto! ${vehicle.dealerName} ofrece test drive en ${vehicle.loc}. Horarios: Lun-Sáb 9am-6pm. ¿Prefieres mañana AM o tarde?`;
  }
  if (/precio|cuota|financ|mensual/i.test(lower)) {
    return `Precio listado: ${fmtRD(vehicle.price)}. Con 20% inicial a 60 meses, cuota estimada ~RD$ ${monthly.toLocaleString("en-US")}/mes. ¿Quieres simular con tu pre-aprobación Credicefi?`;
  }
  if (/km|kilomet|millas/i.test(lower)) {
    return `Kilometraje: ${fmtKm(vehicle.km)}. ${vehicle.featuresLine}. Transmisión ${vehicle.trans}, combustible ${vehicle.fuel}.`;
  }

  return `Sobre este ${vehicle.year} ${vehicle.make} ${vehicle.model}: precio ${fmtRD(vehicle.price)}, ubicado en ${vehicle.loc}. ${vehicle.dealerName} tiene rating ${vehicle.rating}/5 (${vehicle.reviews} reseñas). ¿Qué más te gustaría saber?`;
}

export function buildWhatsAppEscalation(vehicle: Vehicle, summary: string): string {
  return encodeURIComponent(
    `Hola ${vehicle.dealerName}, consulto sobre el ${vehicle.year} ${vehicle.make} ${vehicle.model} (Nadakki #${vehicle.id}).\n\nResumen chat AI:\n${summary}`,
  );
}
