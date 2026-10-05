"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import type { DccTheme } from "@/lib/dcc/tokens";

type Valor = { theme: DccTheme; setTheme: (t: DccTheme) => void };

const DccThemeContext = createContext<Valor | null>(null);

/**
 * Tema claro/oscuro compartido entre el DealerShell y las paginas del DCC: el
 * conmutador de una pagina v2 cambia tambien el chrome. Dura la sesion en
 * memoria (sin Local Storage, sin salto al hidratar). Claro por defecto.
 */
export function DccThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<DccTheme>("light");
  return <DccThemeContext.Provider value={{ theme, setTheme }}>{children}</DccThemeContext.Provider>;
}

/** null fuera de un DccThemeProvider: el llamador usa su propio estado. */
export function useDccThemeContext(): Valor | null {
  return useContext(DccThemeContext);
}
