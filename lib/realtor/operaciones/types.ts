/** Alquiler tiene expediente por etapas; la venta, en la Ola 2, es solo una oportunidad sin expediente (D2-3). */
export type OpKind = "alquiler" | "venta";
export const KINDS: readonly OpKind[] = ["alquiler", "venta"];

export const STAGES = ["propiedad", "condiciones", "documentos", "requisitos", "aprobacion", "firma", "cierre"] as const;
export type StageId = (typeof STAGES)[number];

/** Operación tal como la entrega la fuente. `stage` es null en la venta (no tiene expediente). */
export type Operation = {
  id: string;
  code: string;
  kind: OpKind;
  stage: StageId | null;
  summary: { es: string; en: string };
};

/** Fair Housing: solo tipo de operación y etapa. Ni idioma preferido ni clase protegida. */
export type OpFilters = { kind: OpKind | "todas" };
export const NO_FILTERS: OpFilters = { kind: "todas" };

/** Finanzas dentro de Operaciones (NAV[8] de DL10A): comisión, reparto y cierres. Sin fuente conectada no hay cifras. */
export type FinanceSummary = {
  gross: number; // comisión bruta, USD
  feePct: number; // % de la comisión de la operación
  agentPct: number; // reparto del agente, %
  brokerPct: number; // reparto del broker, %
  closed: number; // operaciones cerradas
};
