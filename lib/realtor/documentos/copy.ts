import type { DocStatus } from "./types";

export type Lang = "es" | "en";

export const COPY = {
  es: {
    title: "Documentos de tus operaciones",
    intro: "Los documentos de cada operación y las plantillas para prepararlos.",
    demo: "DEMO · datos sintéticos",
    empty: "Sin datos todavía",
    emptyHint: "Cuando tengas operaciones con documentos aparecerán aquí.",
    docsTitle: "Documentos de las operaciones", statusCounts: "Documentos por estado",
    tplTitle: "Plantillas", pending: "Pendiente del visto bueno del abogado de Florida",
    approved: "Aprobada por el abogado de Florida", reviewedBy: "Revisó",
    tplNote: "Ninguna plantilla se usa con clientes hasta tener el visto bueno del abogado de Florida.",
    genTitle: "Generar desde una operación", draftTitle: "Borrador del arrendamiento", noDraft: "Todavía no se ha generado ningún borrador para esta operación.",
    notGenerated: "Sin generar", readiness: ["Propiedad, folio y HOA", "Partes y contactos", "Renta, depósito y plazo", "Fecha de entrega de llaves", "Responsable de reparaciones"],
    missing: "Falta", fromCrm: "Del CRM", genBlocked: "Bloqueado · Generar borrador", toOps: "Ir a Operaciones",
    signState: "Estado para firma", brokerApproval: "Aprobación del broker", notRequested: "Sin solicitar",
    notLegal: "No es documento jurídico ni firma electrónica real.", aiNote: "La IA propone el llenado desde datos verificados; nunca inventa cláusulas ni sustituye una plantilla aprobada. Antes de firmar, revisión humana.",
    library: "Biblioteca de plantillas", colName: "Plantilla", colType: "Tipo", colStatus: "Estado",
    lang: "Idioma de la pantalla",
    fairHousing: "Cumplimiento de Fair Housing: esta pantalla no usa ningún dato ni filtro de clase protegida.",
  },
  en: {
    title: "Your transaction documents",
    intro: "The documents of each transaction and the templates to prepare them.",
    demo: "DEMO · synthetic data",
    empty: "No data yet",
    emptyHint: "Once you have transactions with documents they will show up here.",
    docsTitle: "Transaction documents", statusCounts: "Documents by status",
    tplTitle: "Templates", pending: "Pending the Florida attorney's sign-off",
    approved: "Approved by the Florida attorney", reviewedBy: "Reviewed by",
    tplNote: "No template is used with clients until the Florida attorney has signed off.",
    genTitle: "Generate from a transaction", draftTitle: "Lease draft", noDraft: "No draft has been generated for this transaction yet.",
    notGenerated: "Not generated", readiness: ["Property, folio and HOA", "Parties and contacts", "Rent, deposit and term", "Key handover date", "Repairs owner"],
    missing: "Missing", fromCrm: "From CRM", genBlocked: "Blocked · Generate draft", toOps: "Go to Transactions",
    signState: "Signing status", brokerApproval: "Broker approval", notRequested: "Not requested",
    notLegal: "Not a legal document nor a real e-signature.", aiNote: "AI proposes the fill from verified data; it never invents clauses nor replaces an approved template. Human review before signing.",
    library: "Template library", colName: "Template", colType: "Type", colStatus: "Status",
    lang: "Screen language",
    fairHousing: "Fair Housing compliance: this screen uses no protected-class data or filter.",
  },
} as const;

export const DOC_STATUS_LABEL: Record<Lang, Record<DocStatus, string>> = {
  es: { borrador: "Borrador", enviado: "Enviado", firmado: "Firmado", pending_upload: "Pendiente de subida", active: "Activo", archived: "Archivado" },
  en: { borrador: "Draft", enviado: "Sent", firmado: "Signed", pending_upload: "Upload pending", active: "Active", archived: "Archived" },
};
