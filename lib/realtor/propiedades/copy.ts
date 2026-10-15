import type { PropStatus, PropType, Stage } from "./types";

export type Lang = "es" | "en";

export const COPY = {
  es: {
    title: "Propiedades y listings",
    intro: "Cada propiedad con su estado, su tipo y la etapa del pipeline de captación en que va.",
    demo: "DEMO · datos sintéticos",
    empty: "Sin datos todavía",
    emptyHint: "Cuando tengas propiedades registradas aparecerán aquí.",
    listTitle: "Propiedades", noMatch: "Ninguna propiedad coincide con los filtros.",
    fType: "Tipo", fStatus: "Estado", fStage: "Etapa", all: "Todos",
    statusCounts: "Propiedades por estado", stageCounts: "Propiedades por etapa",
    fichaTitle: "Ficha de la propiedad", pickOne: "Elige una propiedad de la lista.",
    price: "Precio", type: "Tipo", status: "Estado", stage: "Etapa", units: "Unidades", noUnits: "Sin unidades",
    beds: "hab.", baths: "baños", lang: "Idioma de la pantalla",
    fairHousing: "Cumplimiento de Fair Housing: los filtros usan solo tipo, estado y etapa. Nunca datos del barrio ni clase protegida.",
  },
  en: {
    title: "Properties and listings",
    intro: "Each property with its status, its type and the stage of the listing pipeline it is in.",
    demo: "DEMO · synthetic data",
    empty: "No data yet",
    emptyHint: "Once you have registered properties they will show up here.",
    listTitle: "Properties", noMatch: "No property matches the filters.",
    fType: "Type", fStatus: "Status", fStage: "Stage", all: "All",
    statusCounts: "Properties by status", stageCounts: "Properties by stage",
    fichaTitle: "Property record", pickOne: "Pick a property from the list.",
    price: "Price", type: "Type", status: "Status", stage: "Stage", units: "Units", noUnits: "No units",
    beds: "bd", baths: "ba", lang: "Screen language",
    fairHousing: "Fair Housing compliance: filters use only type, status and stage. Never neighborhood data or a protected class.",
  },
} as const;

export const TYPE_LABEL: Record<Lang, Record<PropType, string>> = {
  es: { condominio: "Condominio", casa: "Casa", townhouse: "Townhouse", terreno: "Terreno", comercial: "Comercial", otro: "Otro" },
  en: { condominio: "Condo", casa: "House", townhouse: "Townhouse", terreno: "Land", comercial: "Commercial", otro: "Other" },
};
export const STATUS_LABEL: Record<Lang, Record<PropStatus, string>> = {
  es: { activa: "Activa", en_contrato: "En contrato", vendida: "Vendida", retirada: "Retirada" },
  en: { activa: "Active", en_contrato: "Under contract", vendida: "Sold", retirada: "Withdrawn" },
};
export const STAGE_LABEL: Record<Lang, Record<Stage, string>> = {
  es: { acquire: "Captar", cma: "CMA", agreement: "Acuerdo", prepare_publish: "Preparar y publicar", marketing_showings: "Marketing y visitas",
    offers: "Ofertas", contract_contingencies: "Contrato y contingencias", closing: "Cierre" },
  en: { acquire: "Acquire", cma: "CMA", agreement: "Agreement", prepare_publish: "Prepare and publish", marketing_showings: "Marketing and showings",
    offers: "Offers", contract_contingencies: "Contract and contingencies", closing: "Closing" },
};
