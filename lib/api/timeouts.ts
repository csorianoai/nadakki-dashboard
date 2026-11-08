/**
 * UNA politica de topes de espera para el BFF y el cliente (dash#1149 + este cambio).
 *
 * Por que: sin tope, una peticion que nadie contesta deja la pantalla en «Cargando…» para siempre. Con UN tope para todo,
 * las exportaciones y descargas largas (CSV/PDF de SIC, documentos, libro diario...) y las subidas de fotos se cortarian a
 * mitad: el auditor de dash#1149 midio que ese tope de 20 s alcanzaba a lib/api/sic.ts:1058, useProyectos.ts:235,
 * realtor/documentos/download.ts:32 y stipulations.ts:366. Por eso hay tres niveles:
 *
 *   lectura   GET/HEAD                         BFF 20 s   · cliente 25 s
 *   larga     reportes, exportes, descargas,   BFF 120 s  · cliente 130 s   (GET)
 *             documentos, fotos, importes      y 130 s en cualquier metodo
 *   escritura POST/PUT/PATCH/DELETE comunes    BFF sin tope · cliente 60 s
 *   subida    cuerpo FormData/Blob/ArrayBuffer  cliente 130 s
 *
 * El cliente SIEMPRE espera mas que el BFF para ver primero el 504 con cuerpo. En una escritura, vencer el tope del cliente NO
 * significa que el servidor no la hiciera: el 504 sintetico lo dice (`maybe_completed`) para que la pantalla no reintente a ciegas.
 * `timeoutMs: 0` desactiva el tope en una llamada concreta.
 */

export const MS_LECTURA_BFF = 20_000;
export const MS_LARGA_BFF = 120_000;
export const MS_LECTURA_CLIENTE = 25_000;
export const MS_ESCRITURA_CLIENTE = 60_000;
export const MS_LARGA_CLIENTE = 130_000;

/** Segmentos de ruta (o extensiones) de las operaciones largas. Salen de las rutas reales listadas arriba. */
const RUTA_LARGA =
  /(^|\/)(reports?|reportes?|export|exports|exportar|exportaciones|download|descargar?|documents?|documentos?|photos|fotos|media|upload|import|importar)(\/|$|\?)|\.(xlsx?|csv|pdf)(\?|$)/i;

const LECTURA = new Set(["GET", "HEAD"]);

export function esRutaLarga(ruta: string): boolean {
  return RUTA_LARGA.test(ruta || "");
}

/** Tope del BFF (ms) para una peticion, o null si no lleva. Solo las lecturas llevan tope en el BFF. */
export function topeBffMs(metodo: string, ruta: string): number | null {
  if (!LECTURA.has((metodo || "GET").toUpperCase())) return null;
  return esRutaLarga(ruta) ? MS_LARGA_BFF : MS_LECTURA_BFF;
}

function esSubida(cuerpo: unknown): boolean {
  if (cuerpo == null || typeof cuerpo === "string") return false;
  return (
    (typeof FormData !== "undefined" && cuerpo instanceof FormData) ||
    (typeof Blob !== "undefined" && cuerpo instanceof Blob) ||
    cuerpo instanceof ArrayBuffer ||
    ArrayBuffer.isView(cuerpo as ArrayBufferView)
  );
}

/** Tope del cliente (ms) para una peticion; siempre mayor que el del BFF para la misma ruta. */
export function topeClienteMs(metodo: string, ruta: string, cuerpo?: unknown): number {
  const m = (metodo || "GET").toUpperCase();
  if (LECTURA.has(m)) return esRutaLarga(ruta) ? MS_LARGA_CLIENTE : MS_LECTURA_CLIENTE;
  return esSubida(cuerpo) || esRutaLarga(ruta) ? MS_LARGA_CLIENTE : MS_ESCRITURA_CLIENTE;
}
