/** Campos RESO que usa la integración Bridge Interactive / MIAMI MLS. */

export type MlsStandardStatus = "Active" | "Pending" | "Closed" | "Expired" | "Withdrawn" | "Hold";

export interface MlsListing {
  /** ListingKey RESO: identificador único del listado. */
  listingKey: string;
  listPrice: number;
  /** Moneda ISO-4217 (Bridge devuelve USD por defecto para MIAMI). */
  currency: string;
  standardStatus: MlsStandardStatus;
  /** Dirección mostrable construida en el cliente Bridge. Nunca dirección completa en listados IDX. */
  address: string;
  city: string;
  stateOrProvince: string;
  postalCode: string;
  propertyType: string;
  propertySubType: string;
  bedroomsTotal: number | null;
  bathroomsTotal: number | null;
  livingArea: number | null;
  /** Nombre de la oficina listadora (obligatorio para atribución MIAMI IDX). */
  listOfficeName: string;
  photosCount: number;
  /** ISO-8601: última actualización del listado en la MLS. */
  modificationTimestamp: string;
}

export interface MlsPage {
  listings: readonly MlsListing[];
  totalCount: number;
  /** ISO-8601: momento en que se obtuvo la página. */
  asOf: string;
}

/** Respuesta de la API interna /api/realtor/mls/listings. */
export interface MlsApiResponse {
  available: boolean;
  listings: readonly MlsListing[];
  totalCount?: number;
  asOf?: string;
}
