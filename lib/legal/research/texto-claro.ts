/**
 * La barra y la caja de Investigación son oscuras, pero el tema claro de Legal (styles/legal-claro.css) fuerza
 * con !important texto oscuro en todo input, textarea y select: lo escrito quedaba casi invisible
 * (medido en producción el 27-nov-2026: rgb(15, 23, 42) sobre azul noche). Un estilo en línea con
 * !important gana a la hoja global sin tocarla.
 */
export const TEXTO_SOBRE_OSCURO = "#eef2f8";

export function textoClaro(el: HTMLElement | null, color: string = TEXTO_SOBRE_OSCURO): void {
  if (!el) return;
  el.style.setProperty("color", color, "important");
  el.style.setProperty("-webkit-text-fill-color", color, "important");
}
