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

export function buildProyectoPatchPayload(form: ProyectoEditFormValues): Partial<ProyectoUpdatable> {
  const payload: Partial<ProyectoUpdatable> = {
    nombre: form.nombre.trim(),
    budget_envelope_usd: form.budget_envelope_usd,
    budget_capex_usd: form.budget_capex_usd,
    budget_opex_usd: form.budget_opex_usd,
  };

  const codigo = form.codigo_interno.trim();
  if (codigo) payload.codigo_interno = codigo;

  if (form.fecha_inicio_target) payload.fecha_inicio_target = form.fecha_inicio_target;
  if (form.fecha_fin_target) payload.fecha_fin_target = form.fecha_fin_target;

  return payload;
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
