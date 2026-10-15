import localFont from "next/font/local";

/**
 * Tipografías del chrome Forge. Viven aquí (y no dentro de GlobalForgeAppShell) para que ModuleShell
 * (components/shell) pinte exactamente las mismas fuentes sin importar el armazón global.
 */
const fontSans = localFont({
  src: "../../lib/fonts/files/inter/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--forge-font-sans",
  display: "swap",
});

const fontMono = localFont({
  src: "../../lib/fonts/files/jetbrains-mono/jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 800",
  variable: "--forge-font-mono-opt",
  display: "swap",
});

const fontDisplay = localFont({
  src: "../../lib/fonts/files/source-serif-4/source-serif-4-latin-wght-normal.woff2",
  weight: "200 900",
  variable: "--forge-font-display-opt",
  display: "swap",
});

export const CLASES_FUENTES_FORGE = `${fontSans.variable} ${fontMono.variable} ${fontDisplay.variable}`;
