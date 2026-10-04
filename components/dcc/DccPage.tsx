"use client";

import { useState, type ReactNode } from "react";
import { marcaDesdeBranding } from "@/lib/dcc/marca";
import type { DccTheme } from "@/lib/dcc/tokens";
import { useDealerManagementBranding } from "@/lib/dealer-management/useDealerManagementBranding";
import { DccHeader } from "./DccHeader";
import { DccThemeRoot } from "./DccThemeRoot";

/**
 * Estructura de una pagina del DCC: raiz con tema, cabecera con la marca del
 * tenant y rejilla de tarjetas. El tema dura la sesion en memoria (como la
 * barra del DealerShell): sin Local Storage no hay salto al hidratar.
 */
export function DccPage({ titulo, acciones, children }: { titulo: string; acciones?: ReactNode; children: ReactNode }) {
  const [theme, setTheme] = useState<DccTheme>("light");
  const branding = useDealerManagementBranding();
  const marca = marcaDesdeBranding(branding.data);
  return (
    <DccThemeRoot theme={theme}>
      <div className="overflow-hidden rounded-[var(--dcc-radius)] border border-[var(--dcc-border)]">
        <DccHeader marca={marca} titulo={titulo} theme={theme} onTheme={setTheme} acciones={acciones} />
        <div className="p-5 lg:p-6">{children}</div>
      </div>
    </DccThemeRoot>
  );
}

/** Rejilla de tarjetas: 20 px entre tarjetas y `items-start` para que ninguna se estire ni se corte. */
export function DccGrid({ children }: { children: ReactNode }) {
  return (
    <div data-testid="dcc-grid" className="grid grid-cols-1 items-start gap-[var(--dcc-gap)] md:grid-cols-2 xl:grid-cols-3">
      {children}
    </div>
  );
}
