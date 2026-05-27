export const DOCUMENT_CLASSIFICATIONS = ["public", "internal", "confidential", "strategic"] as const;
export type DocumentClassification = (typeof DOCUMENT_CLASSIFICATIONS)[number];

export const CLASSIFICATION_LABELS: Record<DocumentClassification, string> = {
  public: "Público",
  internal: "Interno",
  confidential: "Confidencial",
  strategic: "Estratégico",
};

export const CLASSIFICATION_BADGE: Record<DocumentClassification, string> = {
  public: "border-emerald-400/40 bg-emerald-500/15 text-emerald-100",
  internal: "border-sky-400/40 bg-sky-500/15 text-sky-100",
  confidential: "border-amber-400/40 bg-amber-500/15 text-amber-100",
  strategic: "border-rose-400/40 bg-rose-500/15 text-rose-100",
};

export const DOC_TYPE_SUGGESTIONS: { value: string; label: string }[] = [
  { value: "titulo", label: "Título de propiedad" },
  { value: "tasacion", label: "Tasación / appraisal" },
  { value: "deslinde", label: "Deslinde / mensura" },
  { value: "certificacion", label: "Certificación de cargas / gravámenes" },
  { value: "cad", label: "Plano CAD / topografía" },
  { value: "estudio_tecnico", label: "Estudios (hidrología, ambiental, vialidad)" },
  { value: "permiso", label: "Permisos de construcción / uso de suelo" },
  { value: "nda", label: "Acuerdo de confidencialidad" },
  { value: "contrato", label: "Contrato (cualquier tipo)" },
  { value: "term_sheet", label: "Term sheet inversión" },
  { value: "cotizacion", label: "Cotización / quote" },
  { value: "orden_compra", label: "Orden de compra" },
  { value: "factura", label: "Factura / invoice" },
  { value: "recibo", label: "Recibo / payment receipt" },
  { value: "nomina", label: "Nómina / payroll" },
  { value: "charter", label: "Project charter" },
  { value: "master_plan", label: "Master plan doc" },
  { value: "im", label: "Information memorandum" },
  { value: "feasibility", label: "Estudio de factibilidad" },
  { value: "otro", label: "Otro (default)" },
];

export const DOC_TYPE_CUSTOM = "__custom__";

export const ALLOWED_EXTENSIONS = [".pdf", ".jpg", ".jpeg", ".png", ".doc", ".docx", ".xls", ".xlsx", ".csv", ".txt"] as const;

export const ALLOWED_EXTENSION_SET = new Set(ALLOWED_EXTENSIONS.map((e) => e.slice(1).toLowerCase()));

export const MAX_DOCUMENT_BYTES = 20 * 1024 * 1024;

export const ACCEPT_ATTR = ALLOWED_EXTENSIONS.join(",");
