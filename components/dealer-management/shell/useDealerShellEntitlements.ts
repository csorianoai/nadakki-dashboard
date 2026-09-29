"use client";

import { useQuery } from "@tanstack/react-query";
import {
  fetchEntitlementsBatch,
  getAccessClientContext,
  shouldRetryAccessQuery,
} from "@/lib/access/client";
import { DEALER_NAV_CAPABILITY_KEYS } from "./dealer-nav";

/**
 * Entitlements del menu del dealer, con clave de cache PROPIA.
 *
 * Por que no se usa `useAccessEntitlementsBatch`: `accessQueryKey`
 * (lib/access/client.ts:140-151) no incluye las claves solicitadas, solo
 * endpoint + tenant + dealer + unidad. Todas las llamadas de una misma pantalla
 * comparten entonces UNA entrada de react-query, y la que gana es la primera que
 * se monta. Como los efectos de montaje de React corren de hijo a padre, la que
 * gana no es el shell sino la pagina (DealerModuleGrid): se comprobo en local,
 * la peticion que sale lleva las 11 claves de la rejilla, no las del menu.
 * Resultado: el menu se quedaba sin decisiones y caia a fail-closed siempre.
 *
 * Con clave propia el shell no compite con nadie y el comportamiento de las
 * paginas existentes no cambia. Cuesta una peticion adicional; el arreglo de
 * fondo (meter las claves en `accessQueryKey`) toca la capa de acceso de todos
 * los cores y no cabe en F2.
 */
export function useDealerShellEntitlements() {
  const context = getAccessClientContext();

  return useQuery({
    queryKey: [
      "access",
      "dealer-shell-nav",
      context?.tenantId ?? "none",
      context?.dealerId ?? "none",
      context?.organizationUnitId ?? "none",
    ] as const,
    queryFn: () => fetchEntitlementsBatch(DEALER_NAV_CAPABILITY_KEYS, context),
    enabled: context != null,
    retry: shouldRetryAccessQuery,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
