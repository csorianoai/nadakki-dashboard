/**
 * D8 — lo que el guion exige, sin Playwright: rutas, titulos, textos, testids
 * y la lectura del GET fiscal. `D8.spec.ts` lo usa contra el tenant QA y
 * `tests/e2e-mapaal/d8-guion.test.ts` lo compara con el codigo de la app, para
 * que un texto o un testid renombrado rompa en Jest y no en el loop.
 *
 * Sin imports: Playwright y Jest lo cargan igual.
 */

export const RUTAS = {
  plan: "/contable/plan-cuentas",
  libro: "/contable/libro-mayor",
  balance: "/contable/balance-comprobacion",
} as const;

/** El `<h1>` de cada pantalla (`ContablePageShell`). */
export const TITULOS = {
  plan: "Plan de cuentas",
  libro: "Libro mayor",
  balance: "Balance de comprobación",
} as const;

/** `ProtectedRoute.tsx`. */
export const SESION_FALLIDA = "No se pudo verificar la sesion";
export const SESION_VERIFICANDO = "Verificando sesion...";
export const REINTENTAR = "Reintentar";

export const TESTIDS = {
  arca: "facturacion-arca",
  problema: "facturacion-problema",
  errorReintentar: "contable-error-reintentar",
} as const;

/** `ARCA_TITULO` de `lib/contable/fiscal-dispatch.ts`. */
export const ARCA_TITULO = "Facturación electrónica: se gestiona en ARCA";
export const AR_NOT_CONFIGURED = "AR_NOT_CONFIGURED";

export const PREFIJO_FISCAL = "/api/v1/contable/fiscal/";
export const PREFIJO_REFRESH = "/api/v2/auth/refresh";

export function esPeticionFiscal(url: string): boolean {
  return new URL(url).pathname.startsWith(PREFIJO_FISCAL);
}

export function esRefresh(url: string): boolean {
  return new URL(url).pathname.startsWith(PREFIJO_REFRESH);
}

export function esLogin(pathname: string): boolean {
  return pathname.startsWith("/login");
}

/**
 * Por que el GET fiscal NO es el que el guion espera para un tenant AR, o
 * `null` si lo es: 409 con `detail.error = AR_NOT_CONFIGURED`, llegado por el
 * proxy sin envolver en "Upstream error" (#573).
 */
export function fallaFiscalAR(status: number, cuerpo: string): string | null {
  if (cuerpo.includes("Upstream error"))
    return "el proxy envolvio la respuesta en 'Upstream error'";
  if (status !== 409) return `status ${status}, se esperaba 409`;
  let detalle: unknown;
  try {
    detalle = (JSON.parse(cuerpo) as { detail?: unknown }).detail;
  } catch {
    return "el cuerpo no es JSON";
  }
  const error =
    detalle && typeof detalle === "object"
      ? (detalle as { error?: unknown }).error
      : undefined;
  if (error !== AR_NOT_CONFIGURED)
    return `detail.error = ${JSON.stringify(error)}, se esperaba ${AR_NOT_CONFIGURED}`;
  return null;
}
