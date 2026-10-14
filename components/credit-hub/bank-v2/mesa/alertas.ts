import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";
import type { MonthlyGoalItem } from "@/lib/credit-hub/types/goals";
import { presentMonthlyGoal } from "@/lib/credit-hub/utils/goalPresentation";
import { estaPendiente } from "./mesa";
import { estadoMeta } from "./metas";

export type Alerta = { id: string; tono: "alta" | "media"; titulo: string; detalle: string };

const plural = (n: number, uno: string, varios: string) => `${n} ${n === 1 ? uno : varios}`;

/**
 * Alertas de la Mesa (bank-v2) SOLO con datos que ya llegan: la cola y las
 * metas del mes. El panel antiguo tenia cuatro, dos de ellas fijas de demo
 * ("Objetivos DEMO", "Asignación ROADMAP") y un "SLA crítico" que suponia un
 * plazo de 6 h que la cola no expone. Aqui no hay ninguna de esas: si no pasa
 * nada, no hay alerta.
 */
export function alertasMesa({
  items,
  metas,
  periodo,
  ahora,
}: {
  items: BankQueueItem[];
  metas: MonthlyGoalItem[];
  periodo: string;
  ahora: Date;
}): Alerta[] {
  const pendientes = items.filter(estaPendiente);
  const alertas: Alerta[] = [];

  const altas = pendientes.filter((i) => i.priority === "ALTA").length;
  if (altas > 0)
    alertas.push({ id: "prioridad-alta", tono: "alta", titulo: plural(altas, "solicitud de prioridad alta", "solicitudes de prioridad alta"), detalle: "Pendientes de decisión en la cola." });

  const mensajes = pendientes.filter((i) => (i.pendiente_respuesta_banco ?? 0) > 0).length;
  if (mensajes > 0)
    alertas.push({ id: "mensajes", tono: "alta", titulo: plural(mensajes, "solicitud con mensajes sin responder", "solicitudes con mensajes sin responder"), detalle: "El dealer espera respuesta del banco." });

  const contraofertas = items.filter((i) => (i.state ?? "").toLowerCase().includes("counter")).length;
  if (contraofertas > 0)
    alertas.push({ id: "contraofertas", tono: "media", titulo: plural(contraofertas, "contraoferta activa", "contraofertas activas"), detalle: "Esperando respuesta del dealer." });

  for (const m of metas) {
    const estado = estadoMeta(m, periodo, ahora, presentMonthlyGoal(m, "", periodo).status);
    if (estado === "atrasado")
      alertas.push({ id: `meta-${m.metric_key}`, tono: "media", titulo: `Meta en riesgo: ${m.label_es?.trim() || "meta del mes"}`, detalle: "Por debajo de lo esperado a esta altura del mes." });
  }
  return alertas;
}
