"use client";

import { useMemo, type ReactNode } from "react";
import { BuscadorNavegacion } from "@/components/nav/BuscadorNavegacion";
import { MarcoSuite } from "@/components/nav/MarcoSuite";
import { ModuleTopBar } from "@/components/shell/ModuleTopBar";
import { useContextoShell } from "@/components/shell/useContextoShell";
import { modulosVisibles } from "@/lib/modulos/registro";

/**
 * Marco de Realtor OS (ROP-UX-TOPBAR): la misma barra COMÚN que los demás módulos (ModuleTopBar: selector de módulos, Ctrl+K,
 * notificaciones, selector de tenant y usuario) y el buscador Ctrl+K, sin el menú lateral genérico: Realtor pinta su propia
 * barra de centros (app/realtor/layout.tsx). Sin `onMenu`: el cajón móvil de esa barra es de Realtor, no del módulo.
 */
export function MarcoRealtor({ children }: { children: ReactNode }) {
  const { conSesion, usuario, esSuperadmin } = useContextoShell();
  const modulos = useMemo(() => modulosVisibles(usuario), [usuario]);
  return (
    <MarcoSuite barra={<ModuleTopBar modulos={modulos} actual="real-estate" conSesion={conSesion} esSuperadmin={esSuperadmin} />}>
      {children}
      {conSesion ? <BuscadorNavegacion /> : null}
    </MarcoSuite>
  );
}
