"use client";

import { useState, type ReactNode } from "react";
import type { MarcaDcc } from "@/lib/dcc/marca";
import type { DccTheme } from "@/lib/dcc/tokens";
import { useDccThemeContext } from "./DccThemeContext";
import { DccHeader } from "./DccHeader";
import { DccThemeRoot } from "./DccThemeRoot";

export type DccPageProps = { titulo: string; acciones?: ReactNode; children: ReactNode };

/**
 * Pagina DCC con la marca ya resuelta: raiz con tema, cabecera y contenido.
 * No importa nada de ningun portal; el dealer la usa a traves de `DccPage` y
 * el banco directamente. El tema dura la sesion en memoria: sin Local Storage
 * no hay salto al hidratar. Dentro de un shell DCC se comparte con el chrome
 * (DccThemeContext).
 */
export function DccPageMarco({ marca, titulo, acciones, children }: DccPageProps & { marca: MarcaDcc }) {
  const [local, setLocal] = useState<DccTheme>("light");
  const compartido = useDccThemeContext();
  const theme = compartido?.theme ?? local;
  const setTheme = compartido?.setTheme ?? setLocal;
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
