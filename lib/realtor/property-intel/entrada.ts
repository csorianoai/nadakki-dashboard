export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Enlace a PI-D2 desde una señal (PI-D1). El contrato de señales deja `values` abierto: solo se enlaza si trae un
 * `property_id` o `property_unit_id` UUID; si no, null (nada que enlazar, nada inventado).
 */
export function propertyIntelHref(values: Record<string, unknown>): string | null {
  const p = values.property_id;
  const u = values.property_unit_id;
  if (typeof p === "string" && UUID.test(p)) return `/realtor/property-intel/${p}`;
  if (typeof u === "string" && UUID.test(u)) return `/realtor/property-intel/${u}?unit=${u}`;
  return null;
}
