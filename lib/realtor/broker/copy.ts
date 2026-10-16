import type { AgentStatus, ItemKind, ItemStatus } from "./types";

export type Lang = "es" | "en";

export const COPY = {
  es: {
    title: "Bandeja del broker",
    intro: "Lo que espera tu visto bueno y cómo está tu equipo. Esta pantalla es solo de consulta.",
    demo: "DEMO · datos sintéticos",
    empty: "Sin datos todavía",
    emptyHint: "Cuando tu mesa tenga solicitudes aparecerán aquí.",
    error: "No pudimos cargar la bandeja. Inténtalo de nuevo en un momento.",
    readOnly: "Solo lectura: las aprobaciones todavía no se hacen desde aquí.",
    desk: "Mesa del broker", since: "Creada",
    summary: "Resumen", brokerage: "Estado de la firma", pendingByKind: "Pendientes por tipo", agentsByStatus: "Agentes por estado",
    supervisors: "Supervisores con agentes a cargo", supervised: "Agentes activos supervisados", updated: "Actualizado",
    items: "Solicitudes", status: "Estado", kind: "Tipo", all: "Todos", more: "Ver más", loading: "Cargando…",
    detail: "Detalle", close: "Cerrar", subject: "Asunto", noSubject: "Sin descripción", reason: "Motivo de la decisión", decidedAt: "Decidida", requestedAt: "Solicitada",
    detailError: "No pudimos abrir esta solicitud.", lang: "Idioma de la pantalla", filters: "Filtros",
    fairHousing: "Cumplimiento de Fair Housing: esta pantalla no usa ningún dato ni filtro de clase protegida.",
  },
  en: {
    title: "Broker desk",
    intro: "What is waiting for your sign-off and how your team is doing. This screen is view-only.",
    demo: "DEMO · synthetic data",
    empty: "No data yet",
    emptyHint: "Once your desk has requests they will show up here.",
    error: "We could not load the desk. Please try again in a moment.",
    readOnly: "View-only: approvals are not made from here yet.",
    desk: "Broker desk", since: "Created",
    summary: "Summary", brokerage: "Brokerage status", pendingByKind: "Pending by type", agentsByStatus: "Agents by status",
    supervisors: "Supervisors with agents in charge", supervised: "Active supervised agents", updated: "Updated",
    items: "Requests", status: "Status", kind: "Type", all: "All", more: "Show more", loading: "Loading…",
    detail: "Details", close: "Close", subject: "Subject", noSubject: "No description", reason: "Decision reason", decidedAt: "Decided", requestedAt: "Requested",
    detailError: "We could not open this request.", lang: "Screen language", filters: "Filters",
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
