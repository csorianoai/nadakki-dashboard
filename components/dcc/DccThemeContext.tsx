"use client";

import { createContext, useCallback, useContext, useLayoutEffect, useState, type ReactNode } from "react";
import type { DccTheme } from "@/lib/dcc/tokens";

type Valor = { theme: DccTheme; setTheme: (t: DccTheme) => void };

const DccThemeContext = createContext<Valor | null>(null);

/**
 * Tema claro/oscuro compartido entre el DealerShell y las paginas del DCC: el
 * conmutador de una pagina v2 cambia tambien el chrome. Claro por defecto.
 *
 * Sin `storageKey` dura la sesion en memoria, como siempre: DccShell y
 * cualquier otro llamador no cambian. Con `storageKey` --solo lo pasa el
 * DealerShell-- la eleccion se recuerda en Local Storage para que el panel del
 * dealer no vuelva a claro al recargar.
 *
 * HIDRATACION: el primer render sigue siendo SIEMPRE claro, en servidor y en
 * cliente, asi que el HTML hidrata sin diferencias. La preferencia guardada se
 * lee despues, en un efecto de layout: corre antes de que el navegador pinte el
 * commit, de modo que al montar en cliente no hay parpadeo. En una recarga
 * completa el HTML del servidor (claro) puede verse un instante antes de
 * hidratar; quitarlo exigiria un script inline que tocara el estilo del shell
 * antes que React, y React no corrige al hidratar los atributos que no
 * coinciden: el desajuste se quedaria pegado. Se prefiere ese instante a un
 * shell con un estilo que React no controla.
 *
 * Local Storage puede lanzar (modo privado, cuota, politicas): lectura y
 * escritura van en try/catch; si falla, el tema se queda en memoria y en claro.
 */
export function DccThemeProvider({ children, storageKey }: { children: ReactNode; storageKey?: string }) {
  const [theme, setThemeEstado] = useState<DccTheme>("light");

  useLayoutEffect(() => {
    if (!storageKey) return;
    try {
      const guardado = window.localStorage.getItem(storageKey);
      if (guardado === "dark" || guardado === "light") setThemeEstado(guardado);
    } catch {
      // Sin Local Storage: se queda el claro por defecto.
    }
  }, [storageKey]);

  const setTheme = useCallback(
    (t: DccTheme) => {
      setThemeEstado(t);
      if (!storageKey) return;
      try {
        window.localStorage.setItem(storageKey, t);
      } catch {
        // No se pudo guardar: el tema dura la sesion en memoria.
      }
    },
    [storageKey],
  );

  return <DccThemeContext.Provider value={{ theme, setTheme }}>{children}</DccThemeContext.Provider>;
}

/** null fuera de un DccThemeProvider: el llamador usa su propio estado. */
export function useDccThemeContext(): Valor | null {
  return useContext(DccThemeContext);
}
