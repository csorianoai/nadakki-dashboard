/**
 * Bandeja de prioridades unificada de «Mi despacho» (Legal OS, revisión de César 22-nov): plazos, audiencias y
 * revisiones en una sola lista, cada elemento con su acción. Solo une lo que ya dan /deadlines/upcoming,
 * /hearings y /validation-queue: no calcula plazos ni inventa estados.
 */
import type { UpcomingDeadline } from "@/hooks/legal/useUpcomingDeadlines";
import type { HearingOut } from "@/lib/legal/hearings/hearings-types";
import type { ValidationQueueItem } from "@/lib/legal/validation-queue-api";

export type TipoPrioridad = "plazo" | "audiencia" | "revision";

export type ElementoPrioridad = {
  id: string;
  tipo: TipoPrioridad;
  /** Fecha que ordena: vencimiento del plazo, hora de la audiencia o límite de revisión (ISO). null = sin fecha. */
  fecha: string | null;
  /** Vencido o fuera de plazo de revisión: va primero. */
  urgente: boolean;
  titulo: string;
  expediente: string;
  detalle: string | null;
  etiquetas: { texto: string; tono: "red" | "amber" | "blue" }[];
  accion: { label: string; href: string };
};

const enc = encodeURIComponent;

export function desdePlazo(d: UpcomingDeadline): ElementoPrioridad {
  const etiquetas: ElementoPrioridad["etiquetas"] = [];
  if (d.overdue) etiquetas.push({ texto: "Vencido", tono: "red" });
  if (d.is_peremptory) etiquetas.push({ texto: "Perentorio", tono: "red" });
  if (d.has_human_override) etiquetas.push({ texto: "Ajustado por abogado", tono: "blue" });
  if (d.catalog_validated !== true) etiquetas.push({ texto: "Regla no verificada", tono: "amber" });
  return {
    id: `plazo-${d.deadline_id}`,
    tipo: "plazo",
    fecha: /^\d{4}-\d{2}-\d{2}/.test(d.effective_deadline_date || "") ? d.effective_deadline_date.slice(0, 10) : null,
    urgente: d.overdue === true,
    titulo: d.deadline_sub_category || d.deadline_category || "Plazo procesal",
    expediente: d.case_title || d.case_number_internal || "Expediente",
    detalle: d.legal_basis || null,
    etiquetas,
    accion: { label: "Abrir plazos", href: `/legal/cases/${enc(d.case_id)}/deadlines` },
  };
}

export function desdeAudiencia(h: HearingOut, tituloCaso: (id: string) => string | null): ElementoPrioridad {
  const lugar = [h.courtroom, h.location].filter(Boolean).join(" · ");
  return {
    id: `audiencia-${h.id}`,
    tipo: "audiencia",
    fecha: h.hearing_date || null,
    urgente: false,
    titulo: h.title || "Audiencia",
    expediente: (h.case_id && tituloCaso(h.case_id)) || h.external_ref || "Sin expediente vinculado",
    detalle: lugar || null,
    etiquetas: [],
    // La agenda no tiene página por audiencia: con expediente se abre el expediente; si no, la agenda.
    accion: h.case_id
      ? { label: "Abrir expediente", href: `/legal/cases/${enc(h.case_id)}` }
      : { label: "Ver agenda", href: "/legal/audiencias" },
  };
}

export function desdeRevision(i: ValidationQueueItem, tituloCaso: (id: string) => string | null): ElementoPrioridad {
  const etiquetas: ElementoPrioridad["etiquetas"] = [];
  if (i.sla_breached) etiquetas.push({ texto: "Fuera de plazo de revisión", tono: "red" });
  if (i.priority === "critical" || i.priority === "high") etiquetas.push({ texto: i.priority === "critical" ? "Crítica" : "Alta", tono: "amber" });
  const doc = (i as ValidationQueueItem & { document_title?: string | null }).document_title;
  return {
    id: `revision-${i.queue_item_id}`,
    tipo: "revision",
    fecha: i.sla_deadline || null,
    urgente: i.sla_breached === true,
    titulo: doc ? `Revisar: ${doc}` : "Documento por revisar",
    expediente: tituloCaso(i.case_id) || "Expediente",
    detalle: i.status === "assigned" ? "Asignado" : "Pendiente",
    etiquetas,
    accion: { label: "Revisar documento", href: `/legal/cases/${enc(i.case_id)}/documents` },
  };
}

/** Urgentes primero; luego por fecha (las sin fecha al final); a igual fecha, plazo > audiencia > revisión. */
export function ordenarPrioridades(xs: ElementoPrioridad[]): ElementoPrioridad[] {
  const peso: Record<TipoPrioridad, number> = { plazo: 0, audiencia: 1, revision: 2 };
  return [...xs].sort((a, b) => {
    if (a.urgente !== b.urgente) return a.urgente ? -1 : 1;
    const fa = a.fecha ? a.fecha.slice(0, 10) : "9999";
    const fb = b.fecha ? b.fecha.slice(0, 10) : "9999";
    if (fa !== fb) return fa < fb ? -1 : 1;
    return peso[a.tipo] - peso[b.tipo];
  });
}
