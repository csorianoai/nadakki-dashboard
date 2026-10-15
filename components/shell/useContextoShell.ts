"use client";

import { useContext, useMemo } from "react";
import { useRealtorAccess } from "@/components/realtor/useRealtorAccess";
import { AuthContext } from "@/lib/auth/auth-context";
import { isPlatformSuperAdmin } from "@/components/forge/layout/forge-global-sidebar-nav";
import type { ContextoUsuario } from "@/lib/modulos/registro";

/**
 * Contexto del usuario para el armazón de módulos. Tolera la ausencia de AuthProvider (pruebas, páginas
 * sin sesión): entonces `conSesion` es false y el armazón omite lo que depende del usuario.
 */
export function useContextoShell(): { conSesion: boolean; usuario: ContextoUsuario; esSuperadmin: boolean } {
  const auth = useContext(AuthContext);
  const realtor = useRealtorAccess();
  const roles = auth?.allRoles;
  const cores = auth?.tenant?.subscribed_cores;
  const usuario = useMemo<ContextoUsuario>(
    () => ({ roles: roles ?? [], subscribedCores: cores, realtorOk: realtor === "ok" }),
    [roles, cores, realtor],
  );
  return { conSesion: Boolean(auth), usuario, esSuperadmin: isPlatformSuperAdmin(usuario.roles) };
}
