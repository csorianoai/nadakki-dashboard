/** Rol comercial del contacto. Un cliente es un contacto con rol de cliente vigente; sin él es un lead. */
export type ClientRole = "comprador" | "inquilino" | "vendedor";
export type LeadOrigin = "portal" | "referido" | "web" | "redes";
export type LeadStatus = "nuevo" | "contactado" | "calificado" | "perdido";

export const ROLES: readonly ClientRole[] = ["comprador", "inquilino", "vendedor"];
export const ORIGINS: readonly LeadOrigin[] = ["portal", "referido", "web", "redes"];
export const LEAD_STATUSES: readonly LeadStatus[] = ["nuevo", "contactado", "calificado", "perdido"];

/** Contacto tal como lo entrega la fuente. El teléfono y el correo llegan completos y solo se muestran enmascarados. */
export type Contact = {
  id: string;
  name: string;
  role: ClientRole | null;
  roleActive: boolean;
  origin: LeadOrigin;
  leadStatus: LeadStatus | null;
  phone: string;
  email: string;
  summary: { es: string; en: string };
};

/** Fair Housing: solo rol, origen del contacto y estado del lead. Ni idioma preferido ni clase protegida. */
export type ClientFilters = { role: ClientRole | "todos"; origin: LeadOrigin | "todos"; leadStatus: LeadStatus | "todos" };
export const NO_FILTERS: ClientFilters = { role: "todos", origin: "todos", leadStatus: "todos" };
