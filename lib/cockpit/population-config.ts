/** Backend `core_name` values (migration 085/086) mapped to cockpit chip codes. */
export const POPULATION_API_CORES = [
  { apiName: "credit", chipCode: "credit_hub", label: "Credit Hub", color: "#a78bfa" },
  { apiName: "legal", chipCode: "legal", label: "Legal Core", color: "#3b82f6" },
  { apiName: "marketing", chipCode: "marketing", label: "Marketing", color: "#22c55e" },
  { apiName: "sic", chipCode: "sic", label: "SIC", color: "#f59e0b" },
  { apiName: "platform", chipCode: "platform", label: "Platform", color: "#6366f1" },
] as const;

/** Families seeded in migration 085 — backend-driven dropdown options. */
export const POPULATION_FAMILIES = [
  { value: "dealers", label: "Dealers" },
  { value: "oficiales_credito", label: "Oficiales de crédito" },
  { value: "abogados", label: "Abogados" },
  { value: "community_managers", label: "Community managers" },
  { value: "analistas_compliance", label: "Analistas compliance" },
  { value: "admin_plataforma", label: "Admin plataforma" },
] as const;

export type PopulationTabId =
  | "summary"
  | "by-core"
  | "by-family"
  | "by-entity"
  | "by-country"
  | "digital-agents"
  | "activity";

export const POPULATION_TAB_IDS: PopulationTabId[] = [
  "summary",
  "by-core",
  "by-family",
  "by-entity",
  "by-country",
  "digital-agents",
  "activity",
];

export const POPULATION_TAB_LABELS: Record<PopulationTabId, string> = {
  summary: "Resumen",
  "by-core": "Por core",
  "by-family": "Por familia",
  "by-entity": "Por entidad",
  "by-country": "Por país",
  "digital-agents": "Agentes digitales",
  activity: "Actividad",
};
