const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Enlace a PI-D2 desde una señal (PI-D1). El contrato de señales deja `values` abierto: solo se enlaza si trae
 * `property_id` o `property_unit_id` UUID; si no, null (nada que enlazar, nada inventado).
 */
export function propertyIntelHref(values: Record<string, unknown>): string | null {
  return null;
}
