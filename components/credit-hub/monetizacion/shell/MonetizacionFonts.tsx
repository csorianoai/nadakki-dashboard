"use client";

import localFont from "next/font/local";
import type { ReactNode } from "react";

const inter = localFont({
  src: "../../../../lib/fonts/files/inter/inter-latin-wght-normal.woff2",
  weight: "100 900",
  variable: "--fm-font-sans-opt",
  display: "swap",
});

const spaceGrotesk = localFont({
  src: "../../../../lib/fonts/files/space-grotesk/space-grotesk-latin-wght-normal.woff2",
  weight: "300 700",
  variable: "--fm-font-display-opt",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: "../../../../lib/fonts/files/jetbrains-mono/jetbrains-mono-latin-wght-normal.woff2",
  weight: "100 800",
  variable: "--fm-font-mono-opt",
  display: "swap",
});

export function MonetizacionFonts({ children }: { children: ReactNode }) {
  return (
    <div className={`forge-monetizacion ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      {children}
    </div>
  );
}
