/**
 * D2b — lo que el guion de `D2b.spec.ts` da por cierto de la app, en un modulo
 * puro. `tests/e2e-mapaal/d2b-guion.test.ts` lo compara con el codigo de la
 * app, para que un testid o un texto renombrado rompa en Jest y no en el loop.
 *
 * Sin imports: Playwright y Jest lo cargan igual.
 */

/** El mismo tenant QA que D1 y D9. El spec no sigue con otro tenant. */
export const TENANT_QA = "9a9a0001-0000-4000-8000-000000000001";

/** `DEALER_MANAGEMENT_ROOT` de `lib/autos-portal/routes.ts`. */
export const RUTA_DEALER = "/autos/dealer";
export const RUTA_TENANTS = "/tenants";

/** Lo que solo pinta la Suite (`ForgeGlobalCoresSidebar`, `forge-global-sidebar-nav`). */
export const SUITE_OPERATIVA = "Suite operativa";
export const LEGAL_HUB = "Legal Hub";

/** Etiqueta de la tarjeta de plataforma en Inicio (`app/page.tsx`). */
export const DOMINIOS_CATALOGO = "Dominios (catálogo)";

export const TESTIDS = {
  /** `DealerSuiteGate` mientras consulta `/autos/me/dealer-context`. */
  suiteVerificando: "suite-verificando",
  /** `DealerSuiteGate` con dealer, antes de `router.replace`. */
  suiteRedirigiendo: "suite-redirigiendo-dealer",
  /** `app/page.tsx`, solo para personal de plataforma. */
  metricasPlataforma: "home-metricas-plataforma",
  /** `app/tenants/layout.tsx` mientras carga la sesion. */
  tenantsVerificando: "tenants-verificando",
  /** `app/tenants/layout.tsx` sin roles de plataforma. */
  tenantsSoloPlataforma: "tenants-solo-plataforma",
} as const;

/** Lo que /tenants pintaba: literales inventados de `TENANTS_INITIAL`. */
export const TENANTS_INVENTADOS = ["Enterprise One", "SF Rentals", "Tech Startup", "Finance Plus"] as const;

/** La ruta termina en el panel del dealer (`/autos/dealer` o debajo). */
export function enPanelDealer(pathname: string): boolean {
  return pathname === RUTA_DEALER || pathname.startsWith(`${RUTA_DEALER}/`);
}
