"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import type { DccNavGroup } from "@/components/dcc/shell/DccShell";

type Opcion = { id: string; etiqueta: string; grupo: string; href: string };

/** Sin acentos ni mayusculas, para que "analitica" encuentre "Analítica". */
function normal(t: string): string {
  return t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

/** Opciones de la paleta: las pantallas del menu y, con texto, "Buscar solicitudes". */
export function opcionesBuscador(grupos: DccNavGroup[], texto: string, hrefBandeja: string): Opcion[] {
  const q = normal(texto);
  const pantallas = grupos
    .flatMap((g) => g.items.map((i) => ({ id: i.id, etiqueta: i.label, grupo: g.label, href: i.href })))
    .filter((o) => !q || normal(o.etiqueta).includes(q) || normal(o.grupo).includes(q));
  if (!q) return pantallas;
  const buscar: Opcion = {
    id: "buscar-solicitudes",
    etiqueta: `Buscar solicitudes: «${texto.trim()}»`,
    grupo: "Bandeja",
    href: `${hrefBandeja}?q=${encodeURIComponent(texto.trim())}`,
  };
  return [buscar, ...pantallas];
}

/**
 * Buscador ⌘K / Ctrl+K del banco v2. El del panel antiguo no buscaba nada; este
 * no inventa un indice: abre las pantallas del menu y, con texto, la Bandeja
 * ya filtrada (?q=), que es donde vive la busqueda de solicitudes. Se pinta
 * dentro del shell (sin portal) para heredar los colores del tema.
 */
export function BuscadorBanco({ grupos, hrefBandeja, onIr }: { grupos: DccNavGroup[]; hrefBandeja: string; onIr: (href: string) => void }) {
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState("");
  const [activa, setActiva] = useState(0);
  const entrada = useRef<HTMLInputElement>(null);
  const listaId = useId();
  const opciones = useMemo(() => opcionesBuscador(grupos, texto, hrefBandeja), [grupos, texto, hrefBandeja]);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setAbierto((a) => !a);
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  useEffect(() => {
    if (!abierto) return;
    setTexto("");
    setActiva(0);
    entrada.current?.focus();
  }, [abierto]);

  const ir = (o: Opcion | undefined) => {
    if (!o) return;
    setAbierto(false);
    onIr(o.href);
  };

  return (
    <>
      <button
        type="button"
        data-testid="banco-buscador"
        onClick={() => setAbierto(true)}
        aria-label="Buscar (⌘K)"
        aria-keyshortcuts="Meta+K Control+K"
        className={`${DCC_CLASSES.quietButton} gap-2`}
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        <span className="hidden text-xs text-[var(--dcc-fg-subtle)] md:inline">Buscar</span>
        <kbd className="hidden rounded border border-[var(--dcc-border)] px-1 font-mono text-[10px] text-[var(--dcc-fg-subtle)] md:inline">⌘K</kbd>
      </button>
      {abierto ? (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[12vh]" onMouseDown={() => setAbierto(false)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Buscar"
            data-testid="banco-buscador-dialogo"
            onMouseDown={(e) => e.stopPropagation()}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-[var(--dcc-border-strong)] bg-[var(--dcc-surface)] text-[var(--dcc-fg)] shadow-[var(--dcc-shadow)]"
          >
            <div className="flex items-center gap-2 border-b border-[var(--dcc-border)] px-3">
              <Search className="h-4 w-4 text-[var(--dcc-fg-subtle)]" aria-hidden="true" />
              <input
                ref={entrada}
                value={texto}
                role="combobox"
                aria-expanded="true"
                aria-controls={listaId}
                aria-activedescendant={opciones[activa] ? `${listaId}-${opciones[activa].id}` : undefined}
                aria-label="Buscar pantallas o solicitudes"
                placeholder="Busca una pantalla o un solicitante…"
                onChange={(e) => {
                  setTexto(e.target.value);
                  setActiva(0);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setAbierto(false);
                  else if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setActiva((i) => Math.min(i + 1, opciones.length - 1));
                  } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setActiva((i) => Math.max(i - 1, 0));
                  } else if (e.key === "Enter") {
                    e.preventDefault();
                    ir(opciones[activa]);
                  }
                }}
                className="h-12 flex-1 bg-transparent text-sm outline-none"
              />
            </div>
            <ul id={listaId} role="listbox" className="max-h-80 overflow-y-auto py-1">
              {opciones.length === 0 ? <li className={`px-3 py-2 text-sm ${DCC_CLASSES.muted}`}>Sin resultados.</li> : null}
              {opciones.map((o, i) => (
                <li
                  key={o.id}
                  id={`${listaId}-${o.id}`}
                  role="option"
                  aria-selected={i === activa}
                  onMouseEnter={() => setActiva(i)}
                  onClick={() => ir(o)}
                  className={`flex cursor-pointer items-center justify-between gap-3 px-3 py-2 text-sm ${i === activa ? "bg-[var(--dcc-teal-bg)] text-[var(--dcc-teal-ink)]" : ""}`}
                >
                  <span className="truncate">{o.etiqueta}</span>
                  <span className={`shrink-0 text-xs ${DCC_CLASSES.subtle}`}>{o.grupo}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
