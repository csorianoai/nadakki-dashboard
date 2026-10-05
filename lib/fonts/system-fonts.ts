/**
 * Fuentes sin red: sustituto de `next/font/google`.
 *
 * `next/font/google` descarga las fuentes de fonts.gstatic.com durante
 * `next build`; en el runner de CI esa descarga falla y rompe el build
 * ("Cannot read properties of null"). El repo no trae archivos .woff2 ni
 * paquetes @fontsource, asi que las tipografias se resuelven con pilas de
 * fuentes del sistema (la fuente de marca primero, por si esta instalada
 * localmente, y despues equivalentes del sistema).
 *
 * Las variables CSS que antes inyectaba next/font (`--font-inter`,
 * `--forge-font-sans`, `--fm-font-mono-opt`, ...) se definen en `:root`
 * dentro de app/globals.css. Este helper conserva la forma `{ variable,
 * className }` de next/font para no tocar a los consumidores: `variable`
 * devuelve el nombre de la variable como token de clase inerte (sin reglas
 * CSS asociadas) y `className` va vacio porque la familia la fija el CSS.
 */

export interface SystemFont {
  /** Nombre de la variable CSS que provee esta fuente (definida en :root). */
  readonly variable: `--${string}`;
  /** Sin clase: la familia se aplica via CSS (globals.css / Tailwind). */
  readonly className: string;
}

export function systemFont(variable: `--${string}`): SystemFont {
  return { variable, className: "" };
}
