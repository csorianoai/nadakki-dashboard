"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronRight, PanelLeft, PanelLeftClose, X } from "lucide-react";
import { ProyectosFinanzasSidebarLinks } from "@/components/forge/layout/ProyectosFinanzasSidebarLinks";
import { itemActivo, type GrupoMenu } from "@/lib/modulos/registro";
import { CLASES } from "./clases";

const CLAVE_PLEGADO = "nadakki-sidebar-collapsed-modulo";

export type ModuleSidebarProps = {
  /** Nombre del espacio: el del módulo, o «Suite» en la portada. */
  titulo: string;
  moduloId: string | null;
  grupos: GrupoMenu[];
  pathname: string | null;
  /** Cajón abierto en móvil. */
  abierto: boolean;
  onCerrar: () => void;
  /** Todos los grupos desplegados y sin cabecera de acordeón (la Suite: elegir módulo siempre a la vista). */
  plano?: boolean;
};

/**
 * Menú lateral del módulo: grupos desplegables (uno abierto a la vez), item activo MÁS específico con
 * aria-current, plegable a iconos en escritorio y cajón en móvil (con Escape y foco). Comportamiento tomado de
 * ForgeGlobalCoresSidebar y ShellSidebar; el estilo sale de ./clases.
 */
export function ModuleSidebar({ titulo, moduloId, grupos, pathname, abierto, onCerrar, plano = false }: ModuleSidebarProps) {
  const activo = itemActivo(grupos, pathname);
  const grupoActivo = grupos.find((g) => g.items.some((i) => i.id === activo?.id))?.id ?? grupos[0]?.id ?? null;
  const [abiertoGrupo, setAbiertoGrupo] = useState<string | null>(grupoActivo);
  const [plegado, setPlegado] = useState(false);
  const aside = useRef<HTMLElement>(null);

  // Un solo grupo abierto: el de la pantalla actual, cada vez que cambia la ruta.
  useEffect(() => setAbiertoGrupo(grupoActivo), [grupoActivo, pathname]);

  useEffect(() => {
    try {
      setPlegado(window.localStorage.getItem(CLAVE_PLEGADO) === "true");
    } catch { /* sin almacenamiento: queda desplegado */ }
  }, []);

  const alternarPlegado = useCallback(() => {
    setPlegado((p) => {
      try { window.localStorage.setItem(CLAVE_PLEGADO, String(!p)); } catch { /* ignorar */ }
      return !p;
    });
  }, []);

  // Cajón móvil: Escape lo cierra y el foco entra en él al abrirse.
  useEffect(() => {
    if (!abierto) return;
    aside.current?.querySelector<HTMLElement>("a,button")?.focus();
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    document.addEventListener("keydown", tecla);
    return () => document.removeEventListener("keydown", tecla);
  }, [abierto, onCerrar]);

  const unico = grupos.length === 1 || plano;
  return (
    <>
      {abierto ? <div role="presentation" data-testid="menu-telon" className={CLASES.telon} onClick={onCerrar} /> : null}
      <aside
        ref={aside}
        data-testid="menu-modulo"
        data-modulo={moduloId ?? "suite"}
        data-plegado={plegado}
        aria-label={`Menú de ${titulo}`}
        className={`${CLASES.lateral} ${plegado ? CLASES.lateralPlegado : ""} ${abierto ? "translate-x-0" : `${CLASES.lateralOculto} lg:translate-x-0`}`}
      >
        <div className={CLASES.lateralCabecera}>
          {!plegado ? <span className="min-w-0 flex-1 truncate">{titulo}</span> : <span className="sr-only">{titulo}</span>}
          <button type="button" aria-label="Cerrar el menú" onClick={onCerrar} className={`${CLASES.boton} lg:hidden`}>
            <X aria-hidden className="h-4 w-4" />
          </button>
          <button type="button" aria-label={plegado ? "Desplegar el menú" : "Plegar el menú"} aria-pressed={plegado} onClick={alternarPlegado} className={`${CLASES.boton} hidden lg:inline-flex`}>
            {plegado ? <PanelLeft aria-hidden className="h-4 w-4" /> : <PanelLeftClose aria-hidden className="h-4 w-4" />}
          </button>
        </div>
        <nav aria-label={`Navegación de ${titulo}`} className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-2">
          {grupos.map((g) => {
            const open = unico || plegado || abiertoGrupo === g.id;
            return (
              <div key={g.id} className={CLASES.grupo} data-testid={`menu-grupo-${g.id}`}>
                {plegado ? null : plano ? (
                  <p className={CLASES.grupoTitulo}>{g.label}</p>
                ) : unico ? null : (
                  <button type="button" aria-expanded={open} aria-controls={`grupo-${g.id}`} onClick={() => setAbiertoGrupo(open ? null : g.id)} className={CLASES.grupoTitulo}>
                    <span className="min-w-0 flex-1 truncate">{g.label}</span>
                    <ChevronRight aria-hidden className={`h-3.5 w-3.5 shrink-0 transition-transform ${open ? "rotate-90" : ""}`} />
                  </button>
                )}
                {open ? (
                  <ul id={`grupo-${g.id}`} className="space-y-0.5">
                    {g.items.map((it) => {
                      const es = activo?.id === it.id;
                      const Icono = it.icono;
                      if (!it.href && it.pronto) {
                        // Ruta aprobada sin página todavía: sin enlace, para no mandar a un 404 (igual que ForgeGlobalCoresSidebar).
                        return (
                          <li key={it.id}>
                            <div
                              aria-disabled="true"
                              data-pronto={it.pronto}
                              title={plegado ? `${it.label} (Pronto)` : undefined}
                              className={`${CLASES.item} cursor-default opacity-60 ${plegado ? "justify-center !px-0" : ""}`}
                            >
                              {plegado ? <span aria-hidden className="text-[11px] font-semibold">{it.label.charAt(0)}</span> : null}
                              {plegado ? <span className="sr-only">{it.label} (Pronto)</span> : <span className="min-w-0 flex-1 truncate">{it.label}</span>}
                              {plegado ? null : <span className={CLASES.insignia}>Pronto</span>}
                            </div>
                          </li>
                        );
                      }
                      return (
                        <li key={it.id}>
                          <Link
                            href={it.href}
                            title={plegado ? it.label : undefined}
                            aria-label={plegado ? it.label : undefined}
                            aria-current={es ? "page" : undefined}
                            onClick={onCerrar}
                            className={`${CLASES.item} ${es ? CLASES.itemActivo : ""} ${plegado ? "justify-center !px-0" : ""}`}
                          >
                            {Icono ? <Icono aria-hidden className="h-3.5 w-3.5 shrink-0" /> : plegado ? <span aria-hidden className="text-[11px] font-semibold">{it.label.charAt(0)}</span> : null}
                            {plegado ? null : <span className="min-w-0 flex-1 truncate">{it.label}</span>}
                            {!plegado && it.badge ? <span className={CLASES.insignia}>{it.badge}</span> : null}
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                ) : null}
              </div>
            );
          })}
          {moduloId === "proyectos" && !plegado ? <ProyectosFinanzasSidebarLinks onNavigate={onCerrar} /> : null}
        </nav>
      </aside>
    </>
  );
}
