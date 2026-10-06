/**
 * Fuentes del sistema DCC para shells que no son el del dealer (banco).
 * Mismos archivos locales que DealerFonts (lib/fonts/files, OFL): ni el build
 * ni el navegador piden nada a Google Fonts.
 *
 * Sora -> titulos · IBM Plex Sans -> texto · IBM Plex Mono -> cifras
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

/** Clases de variable CSS para la raiz del shell. */
export const dccFontVariables = [sora.variable, ibmPlexSans.variable, ibmPlexMono.variable].join(" ");
