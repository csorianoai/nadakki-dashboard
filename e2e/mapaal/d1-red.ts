/**
 * D1 — la parte pura del guion: que URLs interesan, como se lee la respuesta de
 * dealer-context y que cuenta como una cronologia de red correcta.
 *
 * Sin dependencias de Playwright, para que tests/ci/mapaalD1Red.test.ts la pruebe
 * con Jest sin navegador.
 */

/** superloop/config/fase2.json: ids.tenant_qa. Nunca el tenant real de Mapaal. */
export const TENANT_QA = "9a9a0001-0000-4000-8000-000000000001";

export const DEALER_CONTEXT = /\/api\/v1\/autos\/me\/dealer-context(\?|$)/;
export const VEHICLES = /\/api\/v1\/autos\/dealers\/([^/?]+)\/vehicles(\?|$)/;

export function pathOf(url: string): string {
  try {
    return new URL(url).pathname;
  } catch {
    return url;
  }
}

export function interesa(url: string): boolean {
  const ruta = pathOf(url);
  return DEALER_CONTEXT.test(ruta) || VEHICLES.test(ruta);
}

/**
 * Cronologia de la red: cada peticion de los dos contratos con el orden en que
 * se emitio, y cuando termino la de dealer-context.
 */
export type Evento = { tipo: "request" | "response"; ruta: string; url: string; seq: number };

/** La unica asignacion de la respuesta, o el motivo por el que no la hay. */
export function leerAsignacionUnica(
  body: unknown,
): { ok: true; dealerId: string; unidad: string | null } | { ok: false; motivo: string } {
  const asignaciones = (body as { assignments?: unknown } | null)?.assignments;
  if (!Array.isArray(asignaciones)) return { ok: false, motivo: "la respuesta no trae assignments" };
  if (asignaciones.length !== 1) {
    return { ok: false, motivo: `el usuario QA debe tener exactamente UNA asignacion (tiene ${asignaciones.length})` };
  }
  const a = (asignaciones[0] ?? {}) as Record<string, unknown>;
  const dealerId = a.dealer_id == null ? "" : String(a.dealer_id);
  if (dealerId === "") return { ok: false, motivo: "la asignacion no trae dealer_id" };
  const unidad = typeof a.organization_unit_id === "string" ? a.organization_unit_id : null;
  return { ok: true, dealerId, unidad };
}

/**
 * Los fallos de la cronologia: un solo dealer-context, que termino, y al menos
 * un /vehicles con ese dealer_id emitido despues. Vacio = correcta.
 */
export function fallosDeCronologia(eventos: Evento[], dealerId: string): string[] {
  const fallos: string[] = [];
  const contexto = eventos.filter((e) => DEALER_CONTEXT.test(e.ruta));
  const vehiculos = eventos.filter((e) => e.tipo === "request" && VEHICLES.test(e.ruta));

  const peticionesContexto = contexto.filter((e) => e.tipo === "request").length;
  if (peticionesContexto !== 1) fallos.push(`dealer-context pedido ${peticionesContexto} veces (debe ser 1)`);
  if (vehiculos.length === 0) fallos.push("con dealer resuelto tiene que salir la peticion a /vehicles");

  const finContexto = contexto.find((e) => e.tipo === "response");
  if (!finContexto) {
    fallos.push("dealer-context no termino");
    return fallos;
  }
  for (const v of vehiculos) {
    const id = decodeURIComponent(VEHICLES.exec(v.ruta)![1]!);
    if (id !== dealerId) fallos.push(`/vehicles con dealer_id ${id} (el contrato dice ${dealerId})`);
    if (v.seq <= finContexto.seq) fallos.push("/vehicles salio antes de que dealer-context respondiera");
  }
  return fallos;
}
