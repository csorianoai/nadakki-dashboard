/**
 * D5 — que enlace del inventario es un vehiculo. Pura, sin Playwright, para que
 * tests/e2e-mapaal/d5-vehiculo.test.ts la pruebe con Jest.
 *
 * El inventario tiene `/autos/dealer/inventario/nuevo` (boton "Nuevo vehiculo")
 * ANTES de las filas: un `a[href^="/autos/dealer/inventario/"]` sin excluirlo
 * devuelve ese boton, el spec abre el formulario de alta y el panel de fotos
 * nunca aparece.
 */

export const PREFIJO_VEHICULO = "/autos/dealer/inventario/";

/** Segmentos de /autos/dealer/inventario/ que son pantallas, no vehiculos. */
export const RUTAS_NO_VEHICULO = ["nuevo"];

/** Selector CSS de los enlaces a la ficha de un vehiculo (excluye las pantallas). */
export const SELECTOR_VEHICULO =
  `a[href^="${PREFIJO_VEHICULO}"]` + RUTAS_NO_VEHICULO.map((r) => `:not([href="${PREFIJO_VEHICULO}${r}"])`).join("");

/** Id del primer enlace que apunta a un vehiculo, o "" si no hay. */
export function idPrimerVehiculo(hrefs: string[]): string {
  for (const href of hrefs) {
    if (!href.startsWith(PREFIJO_VEHICULO)) continue;
    const resto = href.slice(PREFIJO_VEHICULO.length).split(/[?#]/)[0];
    if (!resto || resto.includes("/") || RUTAS_NO_VEHICULO.includes(resto)) continue;
    return decodeURIComponent(resto);
  }
  return "";
}
