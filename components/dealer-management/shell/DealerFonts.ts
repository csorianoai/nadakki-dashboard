/**
 * Fuentes del panel del dealer, servidas desde el repo con next/font/local.
 *
 * Ni el build ni el navegador piden nada a Google Fonts: la descarga de build
 * fallaba de forma intermitente (503 de Google -> "An error occurred in
 * next/font") y tumbaba el deploy. Los .woff2 y su licencia OFL viven en
 * lib/fonts/files/.
 *
 * Sora           -> titulos y cifras de KPI   (--font-sora)
 * IBM Plex Sans  -> texto de interfaz          (--font-ibm-plex-sans)
 * IBM Plex Mono  -> montos y tablas numericas  (--font-ibm-plex-mono)
 */

import localFont from "next/font/local";

const sora = localFont({
  src: "../../../lib/fonts/files/sora/sora-latin-wght-normal.woff2",
  weight: "100 800",
  variable: "--font-sora",
  display: "swap",
});

const ibmPlexSans = localFont({
  src: "../../../lib/fonts/files/ibm-plex-sans/ibm-plex-sans-latin-wght-normal.woff2",
  weight: "100 700",
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const ibmPlexMono = localFont({
  src: [
    { path: "../../../lib/fonts/files/ibm-plex-mono/ibm-plex-mono-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../../lib/fonts/files/ibm-plex-mono/ibm-plex-mono-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../../../lib/fonts/files/ibm-plex-mono/ibm-plex-mono-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

/** Clases de variable CSS para el contenedor raiz del panel. */
export const dealerFontVariables = [sora.variable, ibmPlexSans.variable, ibmPlexMono.variable].join(
  " ",
);
