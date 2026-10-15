import type { AgreementStatus, ListingStage, OwnerRole } from "./types";

export type Lang = "es" | "en";

export const COPY = {
  es: {
    title: "Propietarios",
    intro: "Vendedores y arrendadores en el mismo registro de contactos, con su propiedad, su acuerdo y su etapa.",
    demo: "DEMO · datos sintéticos",
    empty: "Sin datos todavía",
    emptyHint: "Cuando tengas propietarios registrados aparecerán aquí con su propiedad y su acuerdo.",
    listTitle: "Ofrecen propiedad: vendedores y arrendadores", noMatch: "Ningún propietario coincide con los filtros.",
    fRole: "Rol", fAgreement: "Acuerdo", all: "Todos", counts: "Propietarios por rol",
    cOwner: "Propietario", cRole: "Rol", cProperty: "Propiedad", cPrice: "Precio solicitado", cAgreement: "Acuerdo de listing", cStage: "Etapa", cFollow: "Próximo seguimiento",
    lang: "Idioma de la pantalla", properties: "propiedades",
    fairHousing: "Cumplimiento de Fair Housing: los filtros usan solo rol y estado del acuerdo. Nunca clase protegida.",
  },
  en: {
    title: "Owners",
    intro: "Sellers and landlords in the same contact registry, with their property, their agreement and their stage.",
    demo: "DEMO · synthetic data",
    empty: "No data yet",
    emptyHint: "Once you have registered owners they will show up here with their property and agreement.",
    listTitle: "Offering a property: sellers and landlords", noMatch: "No owner matches the filters.",
    fRole: "Role", fAgreement: "Agreement", all: "All", counts: "Owners by role",
    cOwner: "Owner", cRole: "Role", cProperty: "Property", cPrice: "Asking price", cAgreement: "Listing agreement", cStage: "Stage", cFollow: "Next follow-up",
    lang: "Screen language", properties: "properties",
    fairHousing: "Fair Housing compliance: filters use only role and agreement status. Never a protected class.",
  },
} as const;

export const ROLE_LABEL: Record<Lang, Record<OwnerRole, string>> = {
  es: { arrendador: "Arrendador", vendedor: "Vendedor" },
  en: { arrendador: "Landlord", vendedor: "Seller" },
};
export const AGREEMENT_LABEL: Record<Lang, Record<AgreementStatus, string>> = {
  es: { vigente: "Vigente", borrador: "En borrador", "sin-acuerdo": "Sin acuerdo" },
  en: { vigente: "In force", borrador: "Draft", "sin-acuerdo": "No agreement" },
};
export const STAGE_LABEL: Record<Lang, Record<ListingStage, string>> = {
  es: { "listing-activo": "Listing activo", disponible: "Disponible", "en-operacion": "En operación" },
  en: { "listing-activo": "Active listing", disponible: "Available", "en-operacion": "In a deal" },
};
