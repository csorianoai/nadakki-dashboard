import type { MatterArea, CaseType } from "./case-types";

export type CoverageStatus = "VERIFIED" | "DRAFT" | "BASIC";

export interface MateriaEntry {
  key: MatterArea;
  label_es: string;
  coverage: CoverageStatus;
  subtypes: { value: string; label_es: string }[];
}

export const MATERIAS: MateriaEntry[] = [
  {
    key: "civil", label_es: "Derecho Civil", coverage: "DRAFT",
    subtypes: [
      { value: "cobro_pesos", label_es: "Cobro de pesos" },
      { value: "apelacion_civil", label_es: "Apelación civil" },
      { value: "otro", label_es: "Otro (especificar)" },
    ],
  },
  {
    key: "penal", label_es: "Derecho Penal", coverage: "DRAFT",
    subtypes: [
      { value: "defensa_imputado", label_es: "Defensa de imputado" },
      { value: "victima_querellante", label_es: "Víctima / querellante" },
      { value: "evaluacion_general", label_es: "Evaluación general" },
      { value: "otro", label_es: "Otro (especificar)" },
    ],
  },
  {
    key: "laboral", label_es: "Derecho Laboral", coverage: "VERIFIED",
    subtypes: [{ value: "otro", label_es: "Otro (especificar)" }],
  },
  {
    key: "inmobiliario", label_es: "Derecho Inmobiliario", coverage: "VERIFIED",
    subtypes: [{ value: "otro", label_es: "Otro (especificar)" }],
  },
  {
    key: "tributario", label_es: "Derecho Tributario", coverage: "VERIFIED",
    subtypes: [{ value: "otro", label_es: "Otro (especificar)" }],
  },
  {
    key: "comercial", label_es: "Derecho Comercial", coverage: "BASIC",
    subtypes: [{ value: "otro", label_es: "Otro (especificar)" }],
  },
  {
    key: "familia", label_es: "Derecho de Familia", coverage: "BASIC",
    subtypes: [{ value: "otro", label_es: "Otro (especificar)" }],
  },
  {
    key: "administrativo", label_es: "Derecho Administrativo", coverage: "BASIC",
    subtypes: [{ value: "otro", label_es: "Otro (especificar)" }],
  },
  {
    key: "bancario", label_es: "Derecho Bancario y Financiero", coverage: "VERIFIED",
    subtypes: [{ value: "otro", label_es: "Otro (especificar)" }],
  },
  {
    key: "cumplimiento", label_es: "Cumplimiento Regulatorio", coverage: "VERIFIED",
    subtypes: [{ value: "otro", label_es: "Otro (especificar)" }],
  },
];

const SUBTYPE_TO_CASE_TYPE: Record<string, CaseType> = {
  "civil:cobro_pesos": "defensa_civil_cobro_pesos",
  "civil:apelacion_civil": "recurso_apelacion_civil",
  "penal:defensa_imputado": "caso_penal_imputado",
  "penal:victima_querellante": "caso_penal_victima_querellante",
  "penal:evaluacion_general": "caso_penal_evaluacion_general",
};

export function deriveCaseType(materia: MatterArea, subtype: string): CaseType | null {
  return SUBTYPE_TO_CASE_TYPE[`${materia}:${subtype}`] ?? null;
}

export const COVERAGE_BADGE: Record<CoverageStatus, { label: string; className: string }> = {
  VERIFIED: { label: "Cobertura legal verificada", className: "bg-emerald-950/40 text-emerald-400 border-emerald-700/40" },
  DRAFT:    { label: "En revisión legal",          className: "bg-amber-950/30 text-amber-400 border-amber-700/40" },
  BASIC:    { label: "Registro básico",            className: "bg-zinc-800/50 text-zinc-400 border-zinc-700/40" },
};
