"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { itemActivo, type ItemMenu } from "@/lib/modulos/registro";
import { CLASES } from "./clases";

export type PestanasGrupoProps = {
  /** Nombre del grupo (o del módulo, si no tiene grupos): etiqueta accesible de la barra. */
  titulo: string;
  /** TODAS las páginas del grupo, en el orden del menú. */
  paginas: ItemMenu[];
  pathname: string | null;
};

const sinMovimiento = () => typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Barra de pestañas sobre el contenido de cada página del grupo. Es navegación por URL, así que son ENLACES con
 * aria-current="page" dentro de un <nav> (no un tablist: no hay paneles que alternar). La pestaña activa es la de
 * href más largo que cubre la URL actual. Desplazamiento horizontal con scroll-snap y gestos en móvil; las flechas
 * solo existen si las pestañas no caben (ResizeObserver + scrollLeft) y se desactivan en cada extremo. Al cargar,
 * la pestaña activa se centra moviendo SOLO la lista (no el scroll de la página).
 */
export function PestanasGrupo({ titulo, paginas, pathname }: PestanasGrupoProps) {
  const lista = useRef<HTMLUListElement>(null);
  const [flechas, setFlechas] = useState({ desborda: false, izq: false, der: false });
  const activo = itemActivo([{ id: "pestanas", label: titulo, items: paginas }], pathname);

  const medir = useCallback(() => {
    const el = lista.current;
    if (!el) return;
    const desborda = el.scrollWidth > el.clientWidth + 1;
    const next = { desborda, izq: desborda && el.scrollLeft > 1, der: desborda && el.scrollLeft + el.clientWidth < el.scrollWidth - 1 };
    setFlechas((p) => (p.desborda === next.desborda && p.izq === next.izq && p.der === next.der ? p : next));
  }, []);

  useEffect(() => {
    const el = lista.current;
    if (!el) return;
    medir();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(medir) : null;
    ro?.observe(el);
    window.addEventListener("resize", medir);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", medir);
    };
  }, [medir, paginas.length]);

  // Centra la pestaña activa al cargar o al cambiar de página (solo la lista; el scroll de la página no se toca).
  useLayoutEffect(() => {
    const el = lista.current;
    const tab = el?.querySelector<HTMLElement>('a[aria-current="page"]');
    if (!el || !tab) return;
    el.scrollLeft = Math.max(0, tab.offsetLeft - (el.clientWidth - tab.offsetWidth) / 2);
    medir();
  }, [activo?.id, medir]);

  const mover = (dir: -1 | 1) => {
    const el = lista.current;
    if (!el) return;
    const left = dir * Math.max(120, Math.round(el.clientWidth * 0.8));
    if (typeof el.scrollBy === "function") el.scrollBy({ left, behavior: sinMovimiento() ? "auto" : "smooth" });
    else el.scrollLeft += left;
  };

  if (paginas.length === 0) return null;
  return (
    <nav aria-label={`Páginas de ${titulo}`} data-testid="pestanas-grupo" className={CLASES.pestanasBarra}>
      {flechas.desborda ? (
        <button type="button" aria-label="Desplazar las pestañas a la izquierda" data-testid="pestanas-flecha-izq" disabled={!flechas.izq} onClick={() => mover(-1)} className={`${CLASES.pestanasFlecha} disabled:opacity-30`}>
          <ChevronLeft aria-hidden className="h-4 w-4" />
        </button>
      ) : null}
      <ul ref={lista} data-testid="pestanas-lista" onScroll={medir} className={CLASES.pestanasLista}>
        {paginas.map((p) => {
          const es = activo?.id === p.id;
          const Icono = p.icono;
          return (
            <li key={p.id} className="flex">
              <Link href={p.href} data-testid="pestana-grupo" aria-current={es ? "page" : undefined} className={`${CLASES.pestana} ${es ? CLASES.pestanaActiva : ""}`}>
                {Icono ? <Icono aria-hidden className="h-3.5 w-3.5 shrink-0" /> : null}
                {p.label}
              </Link>
            </li>
          );
        })}
      </ul>
      {flechas.desborda ? (
        <button type="button" aria-label="Desplazar las pestañas a la derecha" data-testid="pestanas-flecha-der" disabled={!flechas.der} onClick={() => mover(1)} className={`${CLASES.pestanasFlecha} disabled:opacity-30`}>
          <ChevronRight aria-hidden className="h-4 w-4" />
        </button>
      ) : null}
    </nav>
  );
}
