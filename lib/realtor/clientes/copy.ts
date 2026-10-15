import type { ContactKind, ClientRole, LeadOrigin, LeadStatus } from "./types";

export type Lang = "es" | "en";

export const COPY = {
  es: {
    title: "Clientes: compradores e inquilinos",
    kindLabel: "Tipo de contacto", ownerRow: "Ver ficha del propietario", mandates: "mandatos",
    journey: "Recorrido completo", operation: "Operación", budget: "Presupuesto", zone: "Zona", consent: "Consentimiento de comunicaciones", matches: "Propiedades compatibles", fit: "Compatible con presupuesto y zona", over: "Fuera de presupuesto", yes: "sí", no: "no", wa: "WhatsApp", call: "Llamada", seeMatches: "Ver propiedades compatibles", map: "Coincidencias en el mapa", visit: "Agendar visita", chat: "Ver conversación", activity: "Actividad en el portal", activityHint: "Actividad registrada con consentimiento; puede retirarlo cuando quiera.",
    intro: "Lo que busca cada persona y las propiedades que encajan, con el siguiente paso sugerido.",
    demo: "DEMO · datos sintéticos",
    empty: "Sin datos todavía",
    emptyHint: "Cuando tengas contactos registrados aparecerán aquí.",
    tabClients: "Clientes", tabLeads: "Leads", tabAll: "Todos", tabOwners: "Propietarios",
    listTitle: "Buscan propiedad", listHint: "Un solo registro de contactos: una persona puede comprar, vender y alquilar a la vez.", noMatch: "Ningún contacto coincide con los filtros.",
    fRole: "Rol", fOrigin: "Origen", fStatus: "Estado del lead", all: "Todos",
    statusCounts: "Contactos por estado", fichaTitle: "Ficha del contacto", pickOne: "Elige un contacto de la lista.",
    phone: "Teléfono", email: "Correo", origin: "Origen", role: "Rol", status: "Estado del lead",
    masked: "Datos de contacto enmascarados.", lang: "Idioma de la pantalla",
    fairHousing: "Cumplimiento de Fair Housing: los filtros usan solo rol, origen y estado del lead. Nunca clase protegida.",
    none: "Sin estado",
  },
  en: {
    title: "Clients: buyers and renters",
    kindLabel: "Contact type", ownerRow: "Open owner record", mandates: "mandates",
    journey: "Journey complete", operation: "Operation", budget: "Budget", zone: "Area", consent: "Communication consent", matches: "Matching properties", fit: "Fits budget and area", over: "Over budget", yes: "yes", no: "no", wa: "WhatsApp", call: "Call", seeMatches: "See matching properties", map: "Matches on the map", visit: "Schedule a visit", chat: "See conversation", activity: "Portal activity", activityHint: "Activity recorded with consent; you can withdraw it at any time.",
    intro: "What each person is looking for and the properties that fit, with the suggested next step.",
    demo: "DEMO · synthetic data",
    empty: "No data yet",
    emptyHint: "Once you have registered contacts they will show up here.",
    tabClients: "Clients", tabLeads: "Leads", tabAll: "All", tabOwners: "Owners",
    listTitle: "Looking for a property", listHint: "One contact record: a person can buy, sell and rent at once.", noMatch: "No contact matches the filters.",
    fRole: "Role", fOrigin: "Source", fStatus: "Lead status", all: "All",
    statusCounts: "Contacts by status", fichaTitle: "Contact record", pickOne: "Pick a contact from the list.",
    phone: "Phone", email: "Email", origin: "Source", role: "Role", status: "Lead status",
    masked: "Contact details are masked.", lang: "Screen language",
    fairHousing: "Fair Housing compliance: filters use only role, source and lead status. Never a protected class.",
    none: "No status",
  },
} as const;

export const ROLE_LABEL: Record<Lang, Record<ClientRole, string>> = {
  es: { comprador: "Comprador", inquilino: "Inquilino", vendedor: "Vendedor" },
  en: { comprador: "Buyer", inquilino: "Renter", vendedor: "Seller" },
};
export const ORIGIN_LABEL: Record<Lang, Record<LeadOrigin, string>> = {
  es: { portal: "Portal", referido: "Referido", web: "Sitio web", redes: "Redes sociales" },
  en: { portal: "Portal", referido: "Referral", web: "Website", redes: "Social media" },
};
export const STATUS_LABEL: Record<Lang, Record<LeadStatus, string>> = {
  es: { nuevo: "Nuevo", contactado: "Contactado", calificado: "Calificado", perdido: "Perdido" },
  en: { nuevo: "New", contactado: "Contacted", calificado: "Qualified", perdido: "Lost" },
};

export const OWNER_LABEL: Record<Lang, string> = { es: "Propietario", en: "Owner" };
export const OWNER_ROLE_LABEL: Record<Lang, Record<string, string>> = {
  es: { arrendador: "Arrendador", vendedor: "Vendedor" },
  en: { arrendador: "Landlord", vendedor: "Seller" },
};
export const AGREEMENT_LABEL: Record<Lang, Record<string, string>> = {
  es: { vigente: "Acuerdo vigente", borrador: "Borrador", "sin-acuerdo": "Sin acuerdo" },
  en: { vigente: "Active agreement", borrador: "Draft", "sin-acuerdo": "No agreement" },
};
export const KIND_LABEL = (t: { tabAll: string; tabClients: string; tabLeads: string; tabOwners: string }): Record<ContactKind, string> => ({
  todos: t.tabAll, cliente: t.tabClients, lead: t.tabLeads, propietario: t.tabOwners,
});
