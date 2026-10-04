/**
 * D2 — lo que el guion de `D2.spec.ts` da por cierto de la app, en un modulo
 * puro. `tests/e2e-mapaal/d2-guion.test.ts` lo compara con el codigo de la app,
 * para que un texto, un testid o un enlace nuevo del menu rompa en Jest y no en
 * el loop.
 *
 * Sin imports: Playwright y Jest lo cargan igual.
 */

/** `ACCESS_UNVERIFIED_MESSAGE` de `lib/access/reason-codes.ts`. */
export const AVISO = "No se pudieron verificar tus accesos";

/** El reason code de produccion: el batch responde 200 con todo denegado. */
export const REASON = "no_organization_unit";

/** `DealerSidebar.tsx`. */
export const TESTIDS = {
  barra: "dealer-sidebar",
  toggle: "dealer-sidebar-toggle",
  aviso: "dealer-acceso-no-verificado",
} as const;

export const RUTA_PANEL = "/autos/dealer";
export const RUTA_BATCH = "**/api/v1/access/entitlements/batch**";

/**
 * Todos los enlaces del menu que dependen de una capability (dealer-nav.ts).
 * Los de `capability: null` (Inicio, Centro Operativo, Estado de modulos) no
 * son modulos del plan y se pintan siempre.
 */
export const MODULOS = [
  "/autos/dealer/inventario",
  "/autos/dealer/publicar-rapido",
  "/autos/dealer/leads",
  "/autos/dealer/finanzas",
  "/contable",
  "/contable/plan-cuentas",
  "/contable/libro-mayor",
  "/contable/balance-comprobacion",
  "/contable/estado-resultados",
  "/credit-hub/dealer",
  "/credit-hub/dealer/applications",
  "/marketing/campaigns",
  "/autos/dealer/insights",
  "/autos/dealer/conexiones",
] as const;

/**
 * El cuerpo del batch con cada item denegado por `REASON`. Las claves son la
 * union de las pedidas en la URL y las que trajo la respuesta real: solo cambia
 * el veredicto. El resto del cuerpo real se conserva.
 */
export function denegarCuerpo(url: string, real: Record<string, unknown>): Record<string, unknown> {
  const pedidas = (new URL(url).searchParams.get("capabilities") ?? "")
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  const resultados = real.results;
  const reales =
    resultados && typeof resultados === "object" ? Object.keys(resultados as Record<string, unknown>) : [];
  const claves = Array.from(new Set([...pedidas, ...reales]));
  const results = Object.fromEntries(
    claves.map((k) => [k, { allowed: false, reason_code: REASON, limit: null, current_usage: null }]),
  );
  return { ...real, evaluated_organization_unit_id: null, results };
}
