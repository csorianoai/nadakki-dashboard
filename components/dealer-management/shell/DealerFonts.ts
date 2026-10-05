/**
 * Fuentes del panel del dealer, sin red: pilas del sistema.
 *
 * Antes se cargaban con next/font/google, que descarga de Google en
 * `next build` y rompia el build en CI. Ahora las variables se definen en
 * :root de app/globals.css con la fuente de marca primero (si esta instalada
 * localmente) y equivalentes del sistema despues. Ver lib/fonts/system-fonts.
 *
 * Sora           -> titulos y cifras de KPI   (--font-sora)
 * IBM Plex Sans  -> texto de interfaz          (--font-ibm-plex-sans)
 * IBM Plex Mono  -> montos y tablas numericas  (--font-ibm-plex-mono)
 */

import { systemFont } from "@/lib/fonts/system-fonts";

const sora = systemFont("--font-sora");
const ibmPlexSans = systemFont("--font-ibm-plex-sans");
const ibmPlexMono = systemFont("--font-ibm-plex-mono");

/** Clases de variable CSS para el contenedor raiz del panel. */
export const dealerFontVariables = [sora.variable, ibmPlexSans.variable, ibmPlexMono.variable].join(
  " ",
);
