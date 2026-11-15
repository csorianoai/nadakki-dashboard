/**
 * Cliente servidor Bridge Interactive (RESO OData).
 *
 * Solo se importa desde rutas de servidor (app/api/**).
 * Nunca expone credenciales al cliente: lee process.env en cada llamada,
 * no al cargar el módulo, para que el bundle de cliente no las incluya.
 *
 * Contrato MIAMI:
 * - Sin exportar ni guardar copias de los datos fuera de esta caché HTTP.
 * - Sin pasar los datos a ninguna IA o chatbot.
 * - Atribución y avisos en cada listado (ver MlsAttribution.tsx).
 */

import type { MlsListing, MlsPage, MlsStandardStatus } from "./types";

/** Dataset RESO en Bridge. Cuando el dataset MIAMI esté aprobado se configura via env. */
const BRIDGE_API_URL =
  process.env.BRIDGE_API_URL ||
  "https://api.bridgedataoutput.com/api/v2/OData/Property";

const RESO_STATUS_MAP: Record<string, MlsStandardStatus> = {
  Active: "Active",
  Pending: "Pending",
  Closed: "Closed",
  Expired: "Expired",
  Withdrawn: "Withdrawn",
  Hold: "Hold",
};

type ODataItem = Record<string, unknown>;

function str(v: unknown): string {
  return typeof v === "string" && v.trim() ? v : "";
}
function num(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function mapListing(item: ODataItem): MlsListing | null {
  const key = str(item.ListingKey);
  if (!key) return null;

  const price = num(item.ListPrice);
  if (price === null || price <= 0) return null;

  const statusRaw = str(item.StandardStatus);
  const standardStatus: MlsStandardStatus = RESO_STATUS_MAP[statusRaw] ?? "Active";

  const street = [str(item.StreetNumber), str(item.StreetName), str(item.StreetSuffix)]
    .filter(Boolean)
    .join(" ");
  const city = str(item.City) || str(item.PostalCity);
  if (!city) return null;

  const listOfficeName = str(item.ListOfficeName);
  if (!listOfficeName) return null;

  return {
    listingKey: key,
    listPrice: price,
    currency: "USD",
    standardStatus,
    address: street || city,
    city,
    stateOrProvince: str(item.StateOrProvince) || "FL",
    postalCode: str(item.PostalCode),
    propertyType: str(item.PropertyType) || "Residential",
    propertySubType: str(item.PropertySubType),
    bedroomsTotal: num(item.BedroomsTotal),
    bathroomsTotal: num(item.BathroomsTotalInteger) ?? num(item.BathroomsFull),
    livingArea: num(item.LivingArea),
    listOfficeName,
    photosCount: num(item.PhotosCount) ?? 0,
    modificationTimestamp:
      str(item.ModificationTimestamp) || new Date().toISOString(),
  };
}

/** Retorna null en cualquier fallo: token ausente, red, dataset pendiente, cuerpo inválido. */
export async function fetchBridgeListings(
  top = 20,
  skip = 0,
): Promise<MlsPage | null> {
  const token = process.env.BRIDGE_SERVER_TOKEN;
  if (!token) return null;

  const params = new URLSearchParams({
    $top: String(top),
    $skip: String(skip),
    $filter: "StandardStatus eq 'Active'",
    $count: "true",
    $select: [
      "ListingKey",
      "ListPrice",
      "StandardStatus",
      "StreetNumber",
      "StreetName",
      "StreetSuffix",
      "City",
      "PostalCity",
      "StateOrProvince",
      "PostalCode",
      "PropertyType",
      "PropertySubType",
      "BedroomsTotal",
      "BathroomsTotalInteger",
      "BathroomsFull",
      "LivingArea",
      "ListOfficeName",
      "PhotosCount",
      "ModificationTimestamp",
    ].join(","),
  });

  const url = `${BRIDGE_API_URL}?${params}`;

  try {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) return null;

    const body = (await res.json()) as Record<string, unknown>;

    if (!Array.isArray(body?.value)) return null;

    const listings: MlsListing[] = [];
    for (const item of body.value) {
      const mapped = mapListing(item as ODataItem);
      if (mapped) listings.push(mapped);
    }

    const totalCount =
      typeof body["@odata.count"] === "number" ? body["@odata.count"] : listings.length;

    return {
      listings,
      totalCount,
      asOf: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}
