import { MONETIZACION_BASE, MONETIZACION_NAV } from "@/components/credit-hub/monetizacion/shell/nav-routes";

export { MONETIZACION_BASE, MONETIZACION_NAV };

export function isMonetizacionPath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  return pathname === MONETIZACION_BASE || pathname.startsWith(`${MONETIZACION_BASE}/`);
}

export function monetizacionPageTitle(pathname: string | null | undefined): string {
  if (!pathname) return "Monetización";
  if (pathname.includes("/sandbox")) return "Sandbox · componentes §9";
  const match = MONETIZACION_NAV.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  return match?.label ?? "Monetización";
}
