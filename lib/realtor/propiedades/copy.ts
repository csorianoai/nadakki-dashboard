import type { PropStatus, PropType, Stage } from "./types";

export type Lang = "es" | "en";


const FORM_ES = {
  newProperty: "Nueva propiedad", editProperty: "Editar propiedad", save: "Guardar", saving: "Guardando…", cancel: "Cancelar",
  fCountry: "País", fRegion: "Región", fCity: "Ciudad", fZone: "Zona", fPostal: "Código postal", fStreet: "Calle",
  fJurisdiction: "Jurisdicción", fParcel: "Parcela", fPropType: "Tipo de propiedad", fYear: "Año de construcción", fOwner: "Propietario", noOwner: "Sin propietario",
  fUnitLabel: "Unidad", fBeds: "Habitaciones", fBaths: "Baños", unitHint: "Unidad (opcional)", pickType: "Elige un tipo",
  saved: "Propiedad guardada.", loading: "Cargando la propiedad…",
  errValidation: "Revisa los datos: faltan campos obligatorios o tienen un formato inválido.", errForbidden: "No tienes permiso para guardar propiedades.",
  errNotFound: "La propiedad ya no existe o el propietario elegido no se encontró.", errOther: "No se pudo guardar. Inténtalo de nuevo.", errLoad: "No se pudo cargar la propiedad.",
} as const;
const FORM_EN = {
  newProperty: "New property", editProperty: "Edit property", save: "Save", saving: "Saving…", cancel: "Cancel",
  fCountry: "Country", fRegion: "Region", fCity: "City", fZone: "Zone", fPostal: "Postal code", fStreet: "Street",
  fJurisdiction: "Jurisdiction", fParcel: "Parcel", fPropType: "Property type", fYear: "Year built", fOwner: "Owner", noOwner: "No owner",
  fUnitLabel: "Unit", fBeds: "Bedrooms", fBaths: "Bathrooms", unitHint: "Unit (optional)", pickType: "Pick a type",
  saved: "Property saved.", loading: "Loading property…",
  errValidation: "Check the data: required fields are missing or have an invalid format.", errForbidden: "You do not have permission to save properties.",
  errNotFound: "The property no longer exists or the chosen owner was not found.", errOther: "Could not save. Try again.", errLoad: "Could not load the property.",
} as const;

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
    ...FORM_ES,
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
    ...FORM_EN,
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

export const CONTRACT_TYPE_LABEL: Record<Lang, Record<string, string>> = {
  es: { apartment: "Apartamento", house: "Casa", townhouse: "Townhouse", condo: "Condominio", land: "Terreno", commercial: "Comercial", other: "Otro" },
  en: { apartment: "Apartment", house: "House", townhouse: "Townhouse", condo: "Condo", land: "Land", commercial: "Commercial", other: "Other" },
};
