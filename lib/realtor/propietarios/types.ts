/** Propietario = contacto con rol landlord (arrendador) o seller (vendedor). */
export type OwnerRole = "arrendador" | "vendedor";
export type AgreementStatus = "vigente" | "borrador" | "sin-acuerdo";
export type ListingStage = "listing-activo" | "disponible" | "en-operacion";

export const OWNER_ROLES: readonly OwnerRole[] = ["arrendador", "vendedor"];
export const AGREEMENTS: readonly AgreementStatus[] = ["vigente", "borrador", "sin-acuerdo"];

/** Fila tal como la entrega la fuente: contacto, su propiedad y su acuerdo de listing. */
export type OwnerRow = {
  id: string;
  name: string;
  role: OwnerRole;
  property: string;
  priceUsd: number;
  agreement: AgreementStatus;
  stage: ListingStage;
  followUp: { es: string; en: string };
};

/** Fair Housing: solo rol y estado del acuerdo. Ni idioma preferido ni clase protegida. */
export type OwnerFilters = { role: OwnerRole | "todos"; agreement: AgreementStatus | "todos" };
export const NO_FILTERS: OwnerFilters = { role: "todos", agreement: "todos" };
