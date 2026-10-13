import type { ClientRole, LeadOrigin, LeadStatus } from "./types";

export type Lang = "es" | "en";

export const COPY = {
  es: {
    title: "Clientes: compradores e inquilinos",
    intro: "Lo que busca cada persona, con el siguiente paso sugerido. Los prospectos están en Leads.",
    demo: "DEMO · datos sintéticos",
    empty: "Sin datos todavía",
    emptyHint: "Cuando tengas contactos registrados aparecerán aquí.",
    tabClients: "Clientes", tabLeads: "Leads",
    listTitle: "Buscan propiedad", noMatch: "Ningún contacto coincide con los filtros.",
    fRole: "Rol", fOrigin: "Origen", fStatus: "Estado del lead", all: "Todos",
    statusCounts: "Contactos por estado", fichaTitle: "Ficha del contacto", pickOne: "Elige un contacto de la lista.",
    phone: "Teléfono", email: "Correo", origin: "Origen", role: "Rol", status: "Estado del lead",
    masked: "Datos de contacto enmascarados.", lang: "Idioma de la pantalla",
    fairHousing: "Cumplimiento de Fair Housing: los filtros usan solo rol, origen y estado del lead. Nunca clase protegida.",
    none: "Sin estado",
  },
  en: {
    title: "Clients: buyers and renters",
    intro: "What each person is looking for, with the suggested next step. Prospects are under Leads.",
    demo: "DEMO · synthetic data",
    empty: "No data yet",
    emptyHint: "Once you have registered contacts they will show up here.",
    tabClients: "Clients", tabLeads: "Leads",
    listTitle: "Looking for a property", noMatch: "No contact matches the filters.",
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
