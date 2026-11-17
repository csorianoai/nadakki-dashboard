import type { AgentStatus, ItemKind, ItemStatus } from "./types";

export type Lang = "es" | "en";

export const COPY = {
  es: {
    title: "Bandeja del broker",
    intro: "Lo que espera tu visto bueno y cómo está tu equipo. Aquí apruebas o devuelves cada solicitud.",
    demo: "DEMO · datos sintéticos",
    empty: "Sin datos todavía",
    emptyHint: "Cuando tu mesa tenga solicitudes aparecerán aquí.",
    error: "No pudimos cargar la bandeja. Inténtalo de nuevo en un momento.",
    readOnly: "Cada decisión exige un motivo y queda registrada a tu nombre.",
    desk: "Mesa del broker", since: "Creada",
    summary: "Resumen", brokerage: "Estado de la firma", pendingByKind: "Pendientes por tipo", agentsByStatus: "Agentes por estado",
    supervisors: "Supervisores con agentes a cargo", supervised: "Agentes activos supervisados", updated: "Actualizado",
    items: "Solicitudes", status: "Estado", kind: "Tipo", all: "Todos", more: "Ver más", loading: "Cargando…",
    detail: "Detalle", close: "Cerrar", subject: "Asunto", noSubject: "Sin descripción", reason: "Motivo de la decisión", decidedAt: "Decidida", requestedAt: "Solicitada",
    detailError: "No pudimos abrir esta solicitud.", lang: "Idioma de la pantalla", filters: "Filtros",
    decisionReason: "Motivo de tu decisión", approve: "Aprobar", reject: "Devolver", sending: "Enviando…",
    reasonRequired: "Escribe el motivo antes de decidir.",
    conflict: "Esta solicitud ya cambió de estado. Recarga la bandeja.",
    forbidden: "No puedes decidir esta solicitud (por ejemplo, si eres el sujeto o no eres supervisor de la mesa).",
    invalid: "La decisión no es válida o la solicitud ya no cumple los requisitos. Sigue pendiente.",
    decideError: "No pudimos registrar la decisión. Inténtalo de nuevo.",
    fairHousing: "Cumplimiento de Fair Housing: esta pantalla no usa ningún dato ni filtro de clase protegida.",
  },
  en: {
    title: "Broker desk",
    intro: "What is waiting for your sign-off and how your team is doing. Approve or send back each request here.",
    demo: "DEMO · synthetic data",
    empty: "No data yet",
    emptyHint: "Once your desk has requests they will show up here.",
    error: "We could not load the desk. Please try again in a moment.",
    readOnly: "Every decision needs a reason and is recorded under your name.",
    desk: "Broker desk", since: "Created",
    summary: "Summary", brokerage: "Brokerage status", pendingByKind: "Pending by type", agentsByStatus: "Agents by status",
    supervisors: "Supervisors with agents in charge", supervised: "Active supervised agents", updated: "Updated",
    items: "Requests", status: "Status", kind: "Type", all: "All", more: "Show more", loading: "Loading…",
    detail: "Details", close: "Close", subject: "Subject", noSubject: "No description", reason: "Decision reason", decidedAt: "Decided", requestedAt: "Requested",
    detailError: "We could not open this request.", lang: "Screen language", filters: "Filters",
    decisionReason: "Reason for your decision", approve: "Approve", reject: "Send back", sending: "Sending…",
    reasonRequired: "Write the reason before deciding.",
    conflict: "This request already changed state. Reload the desk.",
    forbidden: "You cannot decide this request (for example, you are its subject or not a desk supervisor).",
    invalid: "The decision is not valid or the request no longer meets the requirements. It stays pending.",
    decideError: "We could not record the decision. Please try again.",
    fairHousing: "Fair Housing compliance: this screen uses no protected-class data or filter.",
  },
} as const;

export const STATUS_LABEL: Record<Lang, Record<ItemStatus, string>> = {
  es: { pending: "Pendiente", approved: "Aprobada", rejected: "Rechazada", cancelled: "Cancelada" },
  en: { pending: "Pending", approved: "Approved", rejected: "Rejected", cancelled: "Cancelled" },
};
export const KIND_LABEL: Record<Lang, Record<ItemKind, string>> = {
  es: { agent_activation: "Alta de agente", brand_publication: "Publicación de marca" },
  en: { agent_activation: "Agent activation", brand_publication: "Brand publication" },
};
export const AGENT_LABEL: Record<Lang, Record<AgentStatus, string>> = {
  es: { draft: "Borrador", pending_approval: "En aprobación", active: "Activo", suspended: "Suspendido", offboarded: "Dado de baja" },
  en: { draft: "Draft", pending_approval: "In approval", active: "Active", suspended: "Suspended", offboarded: "Offboarded" },
};
export const BROKERAGE_LABEL: Record<Lang, Record<string, string>> = {
  es: { active: "Activa", pending: "Pendiente", suspended: "Suspendida", draft: "Borrador" },
  en: { active: "Active", pending: "Pending", suspended: "Suspended", draft: "Draft" },
};
