"use client";

import { useEffect, useId, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { RT } from "@/lib/realtor/tokens";
import { SHELL_NAV_COPY, type ShellNavLang } from "@/lib/realtor/shell-nav-copy";
import { ShellSidebar } from "./ShellSidebar";

/** Por debajo de 768 px la barra de centros pasa a cajón. */
export const MOBILE_QUERY = "(max-width: 767.98px)";

/**
 * Hoja del armazón (prefijo .rtnav, sin tocar estilos globales): foco visible de 3 px RT.teal y, antes de hidratar,
 * la barra fija ya no ocupa sus 288 px en móvil (la decisión final la toma `useEsMovil`).
 */
export const RTNAV_CSS = [
  `.rtnav :is(a,button,input,[tabindex]):focus-visible{outline:3px solid ${RT.teal};outline-offset:2px}`,
  `@media ${MOBILE_QUERY}{.rtnav-fixed{display:none!important}}`,
].join("");

/** matchMedia con fallback: sin matchMedia (jsdom, SSR) es escritorio, como hoy. */
export function useEsMovil(): boolean {
  const [movil, setMovil] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia(MOBILE_QUERY);
    const sync = () => setMovil(mq.matches);
    sync();
    if (typeof mq.addEventListener === "function") { mq.addEventListener("change", sync); return () => mq.removeEventListener("change", sync); }
    mq.addListener?.(sync);
    return () => mq.removeListener?.(sync);
  }, []);
  return movil;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

const ICON_BTN: React.CSSProperties = {
  width: 44, height: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 10,
  border: `1px solid ${RT.control}`, cursor: "pointer", padding: 0,
};

function Icono({ d }: { d: string }) {
  return (
    <svg aria-hidden="true" focusable="false" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d={d} />
    </svg>
  );
}

/**
 * Franja móvil del armazón con el botón «Menú de centros» y el cajón (role=dialog) que contiene la misma ShellSidebar.
 * Foco al primer elemento al abrir, Tab atrapado; Escape, el fondo, el botón de cerrar o navegar lo cierran y el foco vuelve al botón.
 */
export function ShellNavDrawer({ view, roles = [], lang = "es" }: { view: string; roles?: readonly string[]; lang?: ShellNavLang }) {
  const t = SHELL_NAV_COPY[lang];
  const [open, setOpen] = useState(false);
  const id = useId();
  const boton = useRef<HTMLButtonElement>(null);
  const cajon = useRef<HTMLDivElement>(null);
  const abierto = useRef(false);
  const pathname = usePathname();
  const ruta = useRef(pathname);

  useEffect(() => {
    if (ruta.current !== pathname) { ruta.current = pathname; setOpen(false); }
  }, [pathname]);

  useEffect(() => {
    if (open) {
      abierto.current = true;
      cajon.current?.querySelector<HTMLElement>(FOCUSABLE)?.focus();
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = prev; };
    }
    if (abierto.current) { abierto.current = false; boton.current?.focus(); }
  }, [open]);

  const cerrar = () => setOpen(false);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Escape") {
      // Escape en el buscador con texto lo limpia (ShellSidebar); el siguiente Escape cierra.
      if (e.target instanceof HTMLInputElement && e.target.value) return;
      e.preventDefault();
      cerrar();
      return;
    }
    if (e.key !== "Tab" || !cajon.current) return;
    const foc = Array.from(cajon.current.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (foc.length === 0) return;
    const [primero, ultimo] = [foc[0], foc[foc.length - 1]];
    const activo = document.activeElement;
    if (e.shiftKey && (activo === primero || !cajon.current.contains(activo))) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && (activo === ultimo || !cajon.current.contains(activo))) { e.preventDefault(); primero.focus(); }
  };

  return (
    <>
      <div data-testid="shell-mobilebar" className="rtnav"
        style={{ display: "flex", alignItems: "center", padding: "8px 16px", background: RT.page, borderBottom: `1px solid ${RT.line}` }}>
        <button ref={boton} type="button" data-testid="shell-nav-toggle" aria-label={t.menu} aria-expanded={open} aria-controls={id}
          onClick={() => setOpen(true)} style={{ ...ICON_BTN, background: RT.white, color: RT.ink }}>
          <Icono d="M3 5h14M3 10h14M3 15h14" />
        </button>
      </div>
      {open ? (
        <div data-testid="shell-nav-backdrop" aria-hidden="true" onClick={cerrar}
          style={{ position: "fixed", inset: 0, zIndex: 60, background: "rgba(14, 25, 34, 0.55)" }} />
      ) : null}
      <div ref={cajon} id={id} role="dialog" aria-modal="true" aria-label={t.menu} hidden={!open} onKeyDown={onKeyDown} className="rtnav"
        style={{ position: "fixed", top: 0, left: 0, bottom: 0, zIndex: 61, width: "min(320px, 88vw)", display: open ? "flex" : "none",
          flexDirection: "column", boxShadow: "0 12px 40px rgba(14, 25, 34, 0.35)" }}>
        {open ? (
          <>
            <button type="button" data-testid="shell-nav-close" aria-label={t.close} onClick={cerrar}
              style={{ ...ICON_BTN, position: "absolute", top: 12, right: 12, zIndex: 1, background: RT.inkDeep, color: RT.navText }}>
              <Icono d="M5 5l10 10M15 5L5 15" />
            </button>
            <ShellSidebar view={view} roles={roles} mode="drawer" onNavigate={cerrar} />
          </>
        ) : null}
      </div>
    </>
  );
}
