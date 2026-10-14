"use client";

import { useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useRealtorAccess } from "@/components/realtor/useRealtorAccess";
import type { NavSection } from "@/lib/navigation";
import { NAV_SECTIONS, filterSectionsForUser, userCanAccessAdminNav } from "./forge-global-sidebar-nav";

/**
 * Las secciones que ESTE usuario ve: módulos del tenant, rol y acceso de Real Estate. Lo usan el menú
 * lateral y el buscador Ctrl+K, así que los dos enseñan exactamente lo mismo.
 */
export function useNavegacionVisible(): { secciones: NavSection[]; showAdmin: boolean } {
  const { tenant, allRoles = [] } = useAuth();
  const showAdmin = userCanAccessAdminNav(allRoles);
  // Real Estate decide su visibilidad con /api/v1/realestate/acceso (200 o nada), no con la suscripción.
  const realtorAccess = useRealtorAccess();
  const secciones = useMemo(
    () =>
      filterSectionsForUser(NAV_SECTIONS, allRoles, tenant?.subscribed_cores, showAdmin).filter(
        (sec) => sec.acceso !== "realtor" || realtorAccess === "ok",
      ),
    [allRoles, showAdmin, tenant?.subscribed_cores, realtorAccess],
  );
  return { secciones, showAdmin };
}
