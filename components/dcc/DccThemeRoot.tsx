"use client";

import type { ReactNode } from "react";
import { dccThemeStyle, type DccTheme } from "@/lib/dcc/tokens";

/** Raiz de una pagina del DCC: las variables del tema viven solo en este nodo. */
export function DccThemeRoot({ theme = "light", children }: { theme?: DccTheme; children: ReactNode }) {
  return (
    <div data-dcc-root="" data-dcc-theme={theme} style={dccThemeStyle(theme)} className="min-h-full bg-[var(--dcc-canvas)] text-[var(--dcc-fg)]">
      {children}
    </div>
  );
}
