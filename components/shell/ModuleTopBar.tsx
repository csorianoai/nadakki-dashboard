"use client";

import Link from "next/link";
import { Bell, Menu, Search } from "lucide-react";
import { TenantSwitcher } from "@/components/forge/auth/TenantSwitcher";
import { UserMenu } from "@/components/forge/auth/UserMenu";
import { BarraSuite } from "@/components/nav/BarraSuite";
import { EVENTO_ABRIR_BUSCADOR } from "@/components/nav/BuscadorNavegacion";
import type { ModuloConfig } from "@/lib/modulos/registro";
import { CLASES } from "./clases";
import { SelectorContexto } from "./SelectorContexto";
import { SelectorModulos } from "./SelectorModulos";

export type ModuleTopBarProps = {
  modulos: ModuloConfig[];
  actual?: string | null;
  /** Abre el cajón del menú lateral (móvil). */
  onMenu?: () => void;
  menuAbierto?: boolean;
  /** Con sesión: buscador, notificaciones, usuario. Sin ella (pruebas, páginas públicas) solo la base. */
  conSesion: boolean;
  esSuperadmin: boolean;
};

/**
 * Barra superior COMÚN de todos los módulos: BarraSuite (logotipo e Inicio, Atrás/Adelante, migas) más el
 * selector de módulos, Ctrl+K, notificaciones, el hueco del selector Empresa/Vista (solo superadmin) y el
 * menú de usuario. Reutiliza los componentes existentes; no crea otros.
 */
export function ModuleTopBar({ modulos, actual, onMenu, menuAbierto, conSesion, esSuperadmin }: ModuleTopBarProps) {
  return (
    <BarraSuite
      antes={
        onMenu ? (
          <button type="button" aria-label="Abrir el menú del módulo" aria-expanded={Boolean(menuAbierto)} onClick={onMenu} className={`${CLASES.boton} lg:hidden`}>
            <Menu aria-hidden className="h-4 w-4" />
          </button>
        ) : null
      }
      despues={<SelectorModulos modulos={modulos} actual={actual} />}
      derecha={
        conSesion ? (
          <div className={CLASES.acciones} data-testid="barra-acciones">
            <button type="button" data-testid="barra-buscar" aria-label="Buscar una pantalla (Ctrl+K)" title="Buscar una pantalla (Ctrl+K)" onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_BUSCADOR))} className={CLASES.boton}>
              <Search aria-hidden className="h-4 w-4" />
              <kbd className={CLASES.tecla}>Ctrl K</kbd>
            </button>
            <Link href="/notifications" data-testid="barra-notificaciones" aria-label="Notificaciones" title="Notificaciones" className={CLASES.boton}>
              <Bell aria-hidden className="h-4 w-4" />
            </Link>
            {esSuperadmin ? (
              <div data-testid="hueco-contexto" className="empty:hidden">
                <SelectorContexto />
              </div>
            ) : null}
            <div className="hidden md:block"><TenantSwitcher /></div>
            <UserMenu />
          </div>
        ) : null
      }
    />
  );
}
