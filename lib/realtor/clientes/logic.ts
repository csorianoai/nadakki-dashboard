import { LEAD_STATUSES, type ClientFilters, type Contact, type ContactKind, type LeadStatus } from "./types";

/** Cliente = contacto con rol de cliente vigente. El resto son prospectos y van en Leads. */
export const isClient = (c: Contact) => c.role !== null && c.roleActive;

export function applyFilters(list: readonly Contact[], f: ClientFilters): Contact[] {
  return list.filter((c) =>
    (f.role === "todos" || c.role === f.role) &&
    (f.origin === "todos" || c.origin === f.origin) &&
    (f.leadStatus === "todos" || c.leadStatus === f.leadStatus));
}

export function countByStatus(list: readonly Contact[]): Record<LeadStatus, number> {
  const out = Object.fromEntries(LEAD_STATUSES.map((s) => [s, 0])) as Record<LeadStatus, number>;
  for (const c of list) if (c.leadStatus) out[c.leadStatus] += 1;
  return out;
}

/** Deja visibles solo los últimos 4 dígitos del teléfono. */
export function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `•••-•••-${digits.slice(-4)}`;
}

/** Deja visible la primera letra del correo y su dominio. */
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  return user && domain ? `${user[0]}•••@${domain}` : "•••";
}

/** Pestaña del listado unificado: «todos» y «propietario» incluyen propietarios; cliente y lead solo contactos. */
export function inKind(c: Contact, kind: ContactKind): boolean {
  return kind === "todos" || (kind === "cliente" ? isClient(c) : kind === "lead" ? !isClient(c) : false);
}
export const showsOwners = (kind: ContactKind, f: ClientFilters) =>
  kind === "propietario" || (kind === "todos" && f.role === "todos" && f.origin === "todos" && f.leadStatus === "todos");
