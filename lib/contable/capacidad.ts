import { useAccessEntitlementsBatch } from "@/lib/access/hooks";

/** La misma clave que firma dinero en /contable; el backend la exige (F4A-4). */
export const CONTABLE_ASIENTO_CAPABILITY = "accounting.ledger.entries";

/**
 * Fail-closed: cargando, con error o sin decision explicita `allowed: true`
 * devuelve false. El 403 del backend sigue siendo la autoridad.
 */
export function useContableAsientoAllowed(): boolean {
  const access = useAccessEntitlementsBatch([CONTABLE_ASIENTO_CAPABILITY]);
  const decision = access.data?.results[CONTABLE_ASIENTO_CAPABILITY];
  return !access.isLoading && !access.error && decision?.allowed === true;
}
