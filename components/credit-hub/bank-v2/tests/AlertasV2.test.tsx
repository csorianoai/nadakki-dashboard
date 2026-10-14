import { alertasMesa } from "@/components/credit-hub/bank-v2/mesa/alertas";
import type { BankQueueItem } from "@/lib/credit-hub/types/bankDecision";

/** AUDIT-COWORK 9/9: alertas de la Mesa solo con datos reales (cola y metas). */
const fila = (id: string, extra: Partial<BankQueueItem> = {}): BankQueueItem => ({
  application_id: id, tenant_id: "t", state: "submitted", applicant_name: id, dealer_id: null, dealer_name: null, vehicle_label: null,
  requested_amount: 1, score: 700, risk_level: null, approval_band: null, priority: "MEDIA", created_at: "2026-10-07T00:00:00Z", bank_decision: null, ...extra,
});
const AHORA = new Date(2026, 9, 28);

describe("alertasMesa", () => {
  it("sin nada que avisar: ninguna alerta (nada fijo de demo ni SLA inventado)", () => {
    expect(alertasMesa({ items: [fila("a")], metas: [], periodo: "2026-10", ahora: AHORA })).toEqual([]);
  });

  it("prioridad alta pendiente, mensajes sin responder y contraofertas, contados", () => {
    const items = [
      fila("a", { priority: "ALTA" }),
      fila("b", { priority: "ALTA", pendiente_respuesta_banco: 2 }),
      fila("c", { priority: "ALTA", state: "decided" }),
      fila("d", { state: "COUNTER_OFFER" }),
    ];
    const r = alertasMesa({ items, metas: [], periodo: "2026-10", ahora: AHORA });
    expect(r.map((a) => a.titulo)).toEqual(["2 solicitudes de prioridad alta", "1 solicitud con mensajes sin responder", "1 contraoferta activa"]);
  });

  it("meta acumulable por debajo del ritmo: 'Meta en riesgo'; por encima, no", () => {
    const meta = { metric_key: "approved_count", label_es: "Solicitudes aprobadas", unit: "count", current_value: 12, target_value: 40 };
    expect(alertasMesa({ items: [], metas: [meta], periodo: "2026-10", ahora: AHORA }).map((a) => a.titulo)).toEqual(["Meta en riesgo: Solicitudes aprobadas"]);
    expect(alertasMesa({ items: [], metas: [meta], periodo: "2026-10", ahora: new Date(2026, 9, 3) })).toEqual([]);
  });

  it("ningun texto de demo ni de SLA", () => {
    const r = alertasMesa({ items: [fila("a", { priority: "ALTA", state: "counter_offer" })], metas: [], periodo: "2026-10", ahora: AHORA });
    expect(JSON.stringify(r)).not.toMatch(/DEMO|ROADMAP|SLA|min\)/);
  });
});
