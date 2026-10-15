import type { DocStatus } from "./types";

export type Lang = "es" | "en";

export const COPY = {
  es: {
    title: "Documentos y contratos",
    intro: "Biblioteca versionada por jurisdicción, idioma y tipo de operación, con los documentos de cada operación.",
    demo: "DEMO · datos sintéticos",
    empty: "Sin datos todavía",
    emptyHint: "Cuando tengas operaciones con documentos aparecerán aquí.",
    docsTitle: "Documentos de las operaciones", statusCounts: "Documentos por estado",
    tplTitle: "Plantillas", pending: "Pendiente del visto bueno del abogado de Florida",
    approved: "Aprobada por el abogado de Florida", reviewedBy: "Revisó",
    tplNote: "Ninguna plantilla se usa con clientes hasta tener el visto bueno del abogado de Florida.",
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
    lang: "Screen language",
    fairHousing: "Fair Housing compliance: this screen uses no protected-class data or filter.",
  },
} as const;

export const DOC_STATUS_LABEL: Record<Lang, Record<DocStatus, string>> = {
  es: { borrador: "Borrador", enviado: "Enviado", firmado: "Firmado" },
  en: { borrador: "Draft", enviado: "Sent", firmado: "Signed" },
};
