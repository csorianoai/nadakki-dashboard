import type { Lang } from "@/lib/realtor/clientes/copy";
import type { ContactKindKey, ContactRoleKey } from "./contact-write";

export const FORM_COPY = {
  es: {
    newContact: "Nuevo contacto", edit: "Editar contacto", editTitle: "Editar contacto", newTitle: "Nuevo contacto",
    displayName: "Nombre completo", displayLabel: "Etiqueta corta", legalName: "Razón social", language: "Idioma preferido", kind: "Tipo de persona", role: "Rol del contacto",
    noRole: "Sin rol", keep: "Déjalo vacío para no cambiarlo", save: "Guardar", saving: "Guardando…", cancel: "Cancelar", saved: "Contacto guardado.",
    nochanges: "No hay cambios que guardar.",
    e403: "No tienes permiso para guardar contactos con esta cuenta.", e401: "Tu sesión terminó: vuelve a iniciar sesión.",
    e404: "El contacto no existe o no pertenece a tu cuenta.", e0: "No se pudo conectar. Inténtalo de nuevo.", e5: "El servidor no pudo guardar el contacto. Inténtalo de nuevo.",
    e422: "Revisa los datos del formulario.", fieldErr: (f: string, m: string) => `${f}: ${m}`,
  },
  en: {
    newContact: "New contact", edit: "Edit contact", editTitle: "Edit contact", newTitle: "New contact",
    displayName: "Full name", displayLabel: "Short label", legalName: "Legal name", language: "Preferred language", kind: "Contact type", role: "Contact role",
    noRole: "No role", keep: "Leave empty to keep it", save: "Save", saving: "Saving…", cancel: "Cancel", saved: "Contact saved.",
    nochanges: "There are no changes to save.",
    e403: "You don't have permission to save contacts with this account.", e401: "Your session ended: sign in again.",
    e404: "The contact doesn't exist or isn't in your account.", e0: "Could not connect. Try again.", e5: "The server could not save the contact. Try again.",
    e422: "Check the form data.", fieldErr: (f: string, m: string) => `${f}: ${m}`,
  },
} as const;

export const KIND_OPTIONS: Record<Lang, Record<ContactKindKey, string>> = {
  es: { person: "Persona", company: "Empresa" }, en: { person: "Person", company: "Company" },
};
export const API_ROLE_LABEL: Record<Lang, Record<ContactRoleKey, string>> = {
  es: { prospect_tenant: "Inquilino potencial", tenant: "Inquilino", landlord: "Arrendador", buyer: "Comprador", seller: "Vendedor", guarantor: "Garante" },
  en: { prospect_tenant: "Prospective renter", tenant: "Renter", landlord: "Landlord", buyer: "Buyer", seller: "Seller", guarantor: "Guarantor" },
};
