/**
 * Administrador sin concesionario en Dealer OS.
 *
 * `DealerShell` corta con "Tu usuario no esta asignado a ningun concesionario"
 * cuando `GET /api/v1/autos/me/dealer-context` devuelve cero asignaciones. Para
 * un usuario de concesionario es lo correcto. Un administrador (tenant_admin o
 * platform_superadmin) no tiene concesionario por definicion y el menu de la
 * Suite le ensena "Concesionarios" y "Credito del concesionario": sin esta
 * salida entraba a un aviso sin enlace y con un menu que solo lleva a ese mismo
 * aviso.
 *
 * Esto NO amplia permisos: no elige dealer, no lee nada de otro tenant y el
 * backend sigue decidiendo. Solo (1) da al administrador un enlace de salida a
 * la Suite y (2) deja pasar a los hijos en el credito del concesionario
 * (/autos/dealer/credito/**), que antes de #827 vivia en /credit-hub/dealer
 * --fuera de este shell, y el administrador sin dealer lo abria--. Ese credito
 * es de ambito tenant (no lee `dealer_id`; sus guards son CHTenantGuard y
 * CHPortalAccessGuard, que ya admiten al administrador).
 */

const ROLES_ADMINISTRADOR = ["tenant_admin", "platform_superadmin"] as const;

export function esAdministrador(roles: ReadonlyArray<{ role_key: string }> | null | undefined): boolean {
  return (roles ?? []).some((r) => (ROLES_ADMINISTRADOR as readonly string[]).includes(r.role_key));
}

export function esCreditoDelDealer(pathname: string | null | undefined): boolean {
  return pathname === "/autos/dealer/credito" || (pathname?.startsWith("/autos/dealer/credito/") ?? false);
}

/** Salida del administrador sin dealer: la Suite. */
export const SALIDA_ADMIN_SIN_DEALER = { href: "/", label: "Ir a la Suite" } as const;
