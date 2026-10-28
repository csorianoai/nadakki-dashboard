"use client";

import Link from "next/link";
import { useContext, useEffect, useId, useRef, useState } from "react";
import { Bell, Menu, MoreHorizontal, Search } from "lucide-react";
import { TenantSwitcher } from "@/components/forge/auth/TenantSwitcher";
import { UserMenu } from "@/components/forge/auth/UserMenu";
import { BarraSuite } from "@/components/nav/BarraSuite";
import { EVENTO_ABRIR_BUSCADOR } from "@/components/nav/BuscadorNavegacion";
import { AuthContext } from "@/lib/auth/auth-context";
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
 * «Más opciones de la barra» (solo por debajo de md): lo que en escritorio va en la barra y en móvil no cabe, el selector de
 * tenant y, solo para superadmin, el selector Empresa/Vista. Reutiliza esos mismos componentes; se cierra con Escape (y
 * devuelve el foco), con un clic fuera o al abrir otro desplegable (que hace ese mismo clic fuera).
 */
function MenuMas({ esSuperadmin }: { esSuperadmin: boolean }) {
  const [abierto, setAbierto] = useState(false);
  const raiz = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const id = useId();

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => {
      if (raiz.current && !raiz.current.contains(e.target as Node)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setAbierto(false);
        boton.current?.focus();
      }
    };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("mousedown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);

  return (
    <div ref={raiz} className="relative shrink-0 md:hidden">
      <button
        ref={boton}
        type="button"
        data-testid="barra-mas"
        aria-label="Más opciones de la barra"
        title="Más opciones"
        aria-haspopup="true"
        aria-expanded={abierto}
        aria-controls={id}
        onClick={() => setAbierto((a) => !a)}
        className={`${CLASES.botonIcono} ${abierto ? CLASES.botonActivo : ""}`}
      >
        <MoreHorizontal aria-hidden className="h-4 w-4" />
      </button>
      {abierto ? (
        <div id={id} role="group" aria-label="Más opciones" data-testid="barra-mas-panel" className={`${CLASES.desplegable} flex flex-col items-start gap-1`}>
          <TenantSwitcher />
          {esSuperadmin ? <SelectorContexto /> : null}
        </div>
      ) : null}
    </div>
  );
}

/**
 * Barra superior COMÚN de todos los módulos: BarraSuite (logotipo e Inicio, Atrás/Adelante, migas) más el
 * selector de módulos, Ctrl+K, notificaciones, el hueco del selector Empresa/Vista (solo superadmin) y el
 * menú de usuario. Reutiliza los componentes existentes; no crea otros. En móvil (<md) el selector de tenant y el
 * de Empresa/Vista pasan al menú «Más» (solo si hay tenant o es superadmin) y el menú de usuario va compacto.
 */
export function ModuleTopBar({ modulos, actual, onMenu, menuAbierto, conSesion, esSuperadmin }: ModuleTopBarProps) {
  const auth = useContext(AuthContext);
  const hayMas = Boolean(auth?.tenant) || esSuperadmin;
  return (
    <BarraSuite
      antes={
        onMenu ? (
          <button type="button" aria-label="Abrir el menú del módulo" aria-expanded={Boolean(menuAbierto)} onClick={onMenu} className={`${CLASES.botonIcono} lg:hidden`}>
            <Menu aria-hidden className="h-4 w-4" />
          </button>
        ) : null
      }
      despues={<SelectorModulos modulos={modulos} actual={actual} />}
      derecha={
        conSesion ? (
          <div className={CLASES.acciones} data-testid="barra-acciones">
            <button type="button" data-testid="barra-buscar" aria-label="Buscar una pantalla (Ctrl+K)" title="Buscar una pantalla (Ctrl+K)" onClick={() => window.dispatchEvent(new Event(EVENTO_ABRIR_BUSCADOR))} className={`${CLASES.botonIcono} md:w-auto md:px-2`}>
              <Search aria-hidden className="h-4 w-4" />
              <kbd className={CLASES.tecla}>Ctrl K</kbd>
            </button>
            <Link href="/notifications" data-testid="barra-notificaciones" aria-label="Notificaciones" title="Notificaciones" className={CLASES.botonIcono}>
              <Bell aria-hidden className="h-4 w-4" />
            </Link>
            {esSuperadmin ? (
              <div data-testid="hueco-contexto" className="hidden md:block md:empty:hidden">
                <SelectorContexto />
              </div>
            ) : null}
            <div className="hidden md:block"><TenantSwitcher /></div>
            {hayMas ? <MenuMas esSuperadmin={esSuperadmin} /> : null}
            {/* UserMenu (forge) trae px-3 py-1.5 y un avatar de 32 px: aquí se compacta su botón para que no se corte en móvil. */}
            <div data-testid="barra-usuario" className="flex shrink-0 items-center [&>div>button]:px-1 [&>div>button]:py-0 md:[&>div>button]:px-3">
              <UserMenu />
            </div>
          </div>
        ) : null
      }
    />
  );
}
