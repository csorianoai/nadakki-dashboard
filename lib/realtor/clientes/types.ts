import type { AgreementStatus, OwnerRole } from "@/lib/realtor/propietarios/types";

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

/** Filtro de tipo de contacto del listado unificado (Clientes, Leads y Propietarios en un solo registro). */
export type ContactKind = "todos" | "cliente" | "lead" | "propietario";
export const KINDS: readonly ContactKind[] = ["todos", "cliente", "lead", "propietario"];

/** Propietario = contacto con rol de propietario más sus mandatos por propiedad (D8). La ficha vive en /realtor/propietarios. */
export type OwnerContact = {
  id: string;
  name: string;
  ownerRole: OwnerRole;
  mandates: readonly { property: string; agreement: AgreementStatus }[];
};

/** Recorrido del cliente en la ficha: qué busca, consentimiento y propiedades compatibles. */
export type Journey = {
  operation: { es: string; en: string };
  budget: { es: string; en: string };
  zone: string;
  consent: { whatsapp: boolean; email: boolean; call: boolean };
  matches: readonly { name: string; detail: { es: string; en: string }; fit: boolean }[];
};
