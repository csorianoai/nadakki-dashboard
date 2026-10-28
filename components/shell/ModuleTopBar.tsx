"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { Bell, Menu, Search } from "lucide-react";
import { TenantSwitcher } from "@/components/forge/auth/TenantSwitcher";
import { UserMenu } from "@/components/forge/auth/UserMenu";
import { BarraSuite } from "@/components/nav/BarraSuite";
import { EVENTO_ABRIR_BUSCADOR } from "@/components/nav/BuscadorNavegacion";
import type { ModuloConfig } from "@/lib/modulos/registro";
import { CLASES } from "./clases";
import { SelectorContexto } from "./SelectorContexto";
import { SelectorModulos } from "./SelectorModulos";
import { TOKENS_PANEL_BARRA } from "./tokens-panel-barra";

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
 *
 * ROP-UX-F3-FIX: las acciones llevan TOKENS_PANEL_BARRA (los paneles de tenant y usuario se pintan con tokens `--forge-*` que
 * fuera de `.forge-app` no existen) y Esc cierra el panel abierto y devuelve el foco a su botón. TenantSwitcher y UserMenu solo
 * se cierran con un clic fuera (`mousedown` en el documento); Esc les envía ese mismo clic fuera.
 */
export function ModuleTopBar({ modulos, actual, onMenu, menuAbierto, conSesion, esSuperadmin }: ModuleTopBarProps) {
  const acciones = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!conSesion) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key !== "Escape" || !acciones.current) return;
      // Un panel abierto es el hermano que sigue al botón dentro de su `div.relative`.
      const abierto = acciones.current.querySelector<HTMLElement>("div.relative > button + *");
      if (!abierto) return;
      const boton = abierto.previousElementSibling as HTMLButtonElement | null;
      document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      boton?.focus();
    };
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [conSesion]);

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
          <div ref={acciones} className={CLASES.acciones} style={TOKENS_PANEL_BARRA} data-testid="barra-acciones">
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
