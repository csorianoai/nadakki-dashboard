/**
 * Fuentes del panel del dealer, cargadas con next/font (self-hosted en el build).
 *
 * No se anade un <link> a fonts.googleapis.com como hace app/layout.tsx para
 * otras superficies: esa CDN se midio caida (503) durante el inventario, y un
 * <link> en runtime deja la tipografia a merced de la red del usuario.
 * next/font descarga una sola vez en build y sirve los ficheros desde el mismo
 * origen, asi que en runtime no hay salto de red ni FOIT. La descarga de build
 * si necesita salida a internet, igual que el Inter/Manrope que el layout raiz
 * ya carga por esta misma via.
 *
 * Sora           -> titulos y cifras de KPI   (--font-sora)
 * IBM Plex Sans  -> texto de interfaz          (--font-ibm-plex-sans)
 * IBM Plex Mono  -> montos y tablas numericas  (--font-ibm-plex-mono)
 */

import { IBM_Plex_Mono, IBM_Plex_Sans, Sora } from "next/font/google";

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-sora",
  display: "swap",
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-sans",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

/** Clases de variable CSS para el contenedor raiz del panel. */
export const dealerFontVariables = [sora.variable, ibmPlexSans.variable, ibmPlexMono.variable].join(
  " ",
);
