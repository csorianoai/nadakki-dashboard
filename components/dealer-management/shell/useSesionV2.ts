"use client";

import { useContext, useEffect, useState, type Context } from "react";
import type { AuthContextValue } from "@/lib/auth/auth-context";

type ContextoV2 = Context<AuthContextValue | null>;

/**
 * El contexto de la sesion V2 (`lib/auth/auth-context`), cargado en un efecto.
 *
 * No va con import estatico: ese modulo arrastra `lib/api/auth-v2`, que resuelve
 * la URL del backend AL CARGARSE y lanza sin backend declarado, y todo test que
 * monte el shell caeria antes de renderizar. El objeto de contexto es el mismo:
 * el modulo se evalua una sola vez. Devuelve null mientras carga o sin provider.
 */
export function useContextoSesionV2(): ContextoV2 | null {
  const [contexto, setContexto] = useState<{ ctx: ContextoV2 } | null>(null);
  useEffect(() => {
    let vivo = true;
    import("@/lib/auth/auth-context")
      .then((mod) => {
        if (vivo) setContexto({ ctx: mod.AuthContext });
      })
      .catch(() => {
        /* Sin backend declarado no hay sesion V2. */
      });
    return () => {
      vivo = false;
    };
  }, []);
  return contexto?.ctx ?? null;
}

/** Lee la sesion de un contexto ya cargado. Componente aparte: los hooks no son condicionales. */
export function useSesionDe(ctx: ContextoV2): AuthContextValue | null {
  return useContext(ctx);
}
