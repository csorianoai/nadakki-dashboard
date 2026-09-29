"use client";

import { usePathname } from "next/navigation";
import { TopNav } from "@/components/nav/TopNav";
import { isDealerManagementPath } from "@/lib/autos-portal/routes";

/**
 * Barra del marketplace "Nadakki Auto" (Inicio / Buscar / Vender / Dealers).
 *
 * Se oculta en el panel del dealer: alli manda el DealerShell, que trae su
 * propia navegacion. Era la segunda de las tres barras que se solapaban en
 * /autos/dealer antes de F2. En el resto de /autos/* no cambia nada.
 */
export function AutosMarketplaceTopNav() {
  const pathname = usePathname();
  if (isDealerManagementPath(pathname)) return null;
  return <TopNav />;
}
