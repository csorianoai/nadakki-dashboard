import type { ProyectoUpdatable } from "@/app/hooks/useProyectos";

export interface ProyectoEditFormValues {
  nombre: string;
  codigo_interno: string;
  budget_envelope_usd: number;
  budget_capex_usd: number;
  budget_opex_usd: number;
  fecha_inicio_target: string;
  fecha_fin_target: string;
}

function numOrZero(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value.replace(/,/g, ""));
    return Number.isFinite(n) ? n : 0;
  }
  return 0;
}

function isoToDateInput(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) return "";
  return value.slice(0, 10);
}

export function proyectoRawToForm(raw: unknown): ProyectoEditFormValues {
  const o = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
  return {
    nombre: String(o.nombre ?? o.name ?? o.title ?? ""),
    codigo_interno: String(o.codigo_interno ?? ""),
    budget_envelope_usd: numOrZero(o.budget_envelope_usd),
    budget_capex_usd: numOrZero(o.budget_capex_usd),
    budget_opex_usd: numOrZero(o.budget_opex_usd),
    fecha_inicio_target: isoToDateInput(o.fecha_inicio_target),
    fecha_fin_target: isoToDateInput(o.fecha_fin_target),
  };
}

export function buildProyectoPatchPayload(
  initial: ProyectoEditFormValues,
  current: ProyectoEditFormValues,
): Partial<ProyectoUpdatable> {
  const updates: Partial<ProyectoUpdatable> = {};

  const nombre = current.nombre.trim();
  if (nombre !== initial.nombre.trim()) updates.nombre = nombre;

  const codigo = current.codigo_interno.trim();
  if (codigo !== initial.codigo_interno.trim()) {
    updates.codigo_interno = codigo || undefined;
  }

  if (current.budget_envelope_usd !== initial.budget_envelope_usd) {
    updates.budget_envelope_usd = current.budget_envelope_usd;
  }
  if (current.budget_capex_usd !== initial.budget_capex_usd) {
    updates.budget_capex_usd = current.budget_capex_usd;
  }
  if (current.budget_opex_usd !== initial.budget_opex_usd) {
    updates.budget_opex_usd = current.budget_opex_usd;
  }

  if (current.fecha_inicio_target !== initial.fecha_inicio_target) {
    updates.fecha_inicio_target = current.fecha_inicio_target || undefined;
  }
  if (current.fecha_fin_target !== initial.fecha_fin_target) {
    updates.fecha_fin_target = current.fecha_fin_target || undefined;
  }

  return updates;
}

export function validateProyectoEditForm(values: ProyectoEditFormValues): string | null {
  if (!values.nombre.trim()) return "El nombre no puede estar vacío.";
  if (values.budget_envelope_usd < 0 || values.budget_capex_usd < 0 || values.budget_opex_usd < 0) {
    return "Los montos deben ser cero o positivos.";
  }
  if (values.fecha_inicio_target && values.fecha_fin_target) {
    if (values.fecha_fin_target < values.fecha_inicio_target) {
      return "La fecha fin no puede ser anterior a la fecha inicio.";
    }
  }
  return null;
}
