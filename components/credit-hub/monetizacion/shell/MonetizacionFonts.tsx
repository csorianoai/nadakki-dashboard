"use client";

import type { ReactNode } from "react";
import { systemFont } from "@/lib/fonts/system-fonts";

// Pilas del sistema (sin Google Fonts): valores en :root de app/globals.css.
const inter = systemFont("--fm-font-sans-opt");
const spaceGrotesk = systemFont("--fm-font-display-opt");
const jetbrainsMono = systemFont("--fm-font-mono-opt");

export function MonetizacionFonts({ children }: { children: ReactNode }) {
  return (
    <div className={`forge-monetizacion ${inter.variable} ${spaceGrotesk.variable} ${jetbrainsMono.variable}`}>
      {children}
    </div>
  );
}
