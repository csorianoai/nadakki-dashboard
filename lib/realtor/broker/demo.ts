import type { Desk, DeskItem, Summary } from "./types";

/** Ejemplo SINTETICO con la forma del contrato; solo se pinta rotulado DEMO y con NEXT_PUBLIC_REALTOR_ALLOW_DEMO="1". */
export const DEMO_DESK: Desk = { id: "demo-desk", brokerage_id: "demo-brokerage", created_at: "2026-01-05T12:00:00Z" };
export const DEMO_SUMMARY: Summary = {
  brokerage_status: "active",
  pending_by_kind: { agent_activation: 2, brand_publication: 1 },
  agents_by_status: { draft: 1, pending_approval: 2, active: 4, suspended: 0, offboarded: 1 },
  supervised_agent_counts: [{ supervisor_agent_id: "demo-sup-1", active_supervised: 3 }],
  generated_at: "2026-10-14T15:00:00Z",
};
export const DEMO_ITEMS: readonly DeskItem[] = [
  { id: "demo-1", kind: "agent_activation", subject_label: "Agente de muestra A", status: "pending", created_at: "2026-10-12T14:00:00Z" },
  { id: "demo-2", kind: "brand_publication", subject_label: "Marca de muestra B", status: "pending", created_at: "2026-10-13T09:30:00Z" },
  { id: "demo-3", kind: "agent_activation", subject_label: "Agente de muestra C", status: "rejected", decision_reason: "Falta documentación (muestra)", decided_at: "2026-10-11T16:00:00Z", created_at: "2026-10-10T10:00:00Z" },
];
