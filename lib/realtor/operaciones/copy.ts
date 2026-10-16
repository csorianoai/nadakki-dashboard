import type { OpKind, StageId } from "./types";

export type Lang = "es" | "en";

export const COPY = {
  es: {
    title: "Operaciones",
    intro: "Cada alquiler avanza por etapas con requisitos, documentos y responsables.",
    demo: "DEMO · datos sintéticos",
    empty: "Sin datos todavía",
    emptyHint: "Cuando tengas operaciones registradas aparecerán aquí, por etapa.",
    stagesLabel: "Etapas", stage: "Etapa", exp: "expedientes",
    fKind: "Tipo de operación", all: "Todas",
    listTitle: "Expedientes de la etapa", noneInStage: "Ningún expediente en esta etapa.",
    oppTitle: "Oportunidades de venta",
    oppNote: "La venta todavía no tiene expediente por etapas: aquí solo se listan sus oportunidades.",
    unstagedTitle: "Alquileres sin etapa informada",
    lang: "Idioma de la pantalla",
    finTitle: "Finanzas", finNote: "Comisión, reparto y cierres de las operaciones de esta pantalla.",
    finGross: "Comisión bruta", finFee: "Comisión sobre el alquiler", finSplit: "Reparto", finAgent: "Agente", finBroker: "Broker", finClosed: "Cierres", finClosedUnit: "operaciones cerradas",
    fairHousing: "Cumplimiento de Fair Housing: los filtros usan solo el tipo de operación y la etapa. Nunca clase protegida.",
  },
  en: {
    title: "Operations",
    intro: "Each rental moves through stages with requirements, documents and owners.",
    demo: "DEMO · synthetic data",
    empty: "No data yet",
    emptyHint: "Once you have registered operations they will show up here, by stage.",
    stagesLabel: "Stages", stage: "Stage", exp: "files",
    fKind: "Operation type", all: "All",
    listTitle: "Files in this stage", noneInStage: "No file in this stage.",
    oppTitle: "Sale opportunities",
    oppNote: "Sales do not have a staged file yet: only their opportunities are listed here.",
    unstagedTitle: "Rentals without a reported stage",
    lang: "Screen language",
    finTitle: "Finance", finNote: "Commission, split and closings for the operations on this screen.",
    finGross: "Gross commission", finFee: "Commission on the rental", finSplit: "Split", finAgent: "Agent", finBroker: "Broker", finClosed: "Closings", finClosedUnit: "closed operations",
    fairHousing: "Fair Housing compliance: filters use only the operation type and the stage. Never a protected class.",
  },
} as const;

export const STAGE_LABEL: Record<Lang, Record<StageId, string>> = {
  es: { propiedad: "Propiedad", condiciones: "Condiciones", documentos: "Documentos", requisitos: "Requisitos", aprobacion: "Aprobación broker", firma: "Firma", cierre: "Cierre" },
  en: { propiedad: "Property", condiciones: "Terms", documentos: "Documents", requisitos: "Requirements", aprobacion: "Broker approval", firma: "Signature", cierre: "Closing" },
};
export const KIND_LABEL: Record<Lang, Record<OpKind, string>> = {
  es: { alquiler: "Alquiler", venta: "Venta" },
  en: { alquiler: "Rental", venta: "Sale" },
};
