/**
 * ENUMs proyectos CORE expuestos por gateway (contrato usuario Fase 1).
 * Mantener alineados con YAML OpenAPI cuando esté versionado en repo.
 */

export const BACKEND_PROJECT_TYPES = [
  "inmobiliario_megaproyecto",
  "real_estate_facilities",
  "capital_project",
  "transformacion_digital",
  "expansion_territorial",
  "integracion_ma",
  "cumplimiento_regulatorio",
  "lanzamiento_producto",
  "excelencia_operacional",
  "iniciativa_estrategica",
  "otro",
] as const;

export type BackendProjectType = (typeof BACKEND_PROJECT_TYPES)[number];

export const BACKEND_PROJECT_TYPE_LABELS_ES: Record<BackendProjectType, string> = {
  inmobiliario_megaproyecto: "Megaproyecto inmobiliario",
  real_estate_facilities: "Real estate / facilities",
  capital_project: "Capital / CAPEX obra",
  transformacion_digital: "Transformación digital",
  expansion_territorial: "Expansión territorial",
  integracion_ma: "Integración / M&A",
  cumplimiento_regulatorio: "Cumplimiento regulatorio",
  lanzamiento_producto: "Lanzamiento de producto",
  excelencia_operacional: "Excelencia operacional",
  iniciativa_estrategica: "Iniciativa estratégica",
  otro: "Otro",
};

export const BACKEND_CLASSIFICATIONS = ["public", "internal", "confidential", "strategic"] as const;

export type BackendClassification = (typeof BACKEND_CLASSIFICATIONS)[number];

export const BACKEND_CLASSIFICATION_LABELS_ES: Record<BackendClassification, string> = {
  public: "Público",
  internal: "Interno",
  confidential: "Confidencial",
  strategic: "Estratégico",
};
