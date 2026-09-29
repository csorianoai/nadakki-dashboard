"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DealerNavItem } from "./dealer-nav";

export type DealerCommandPaletteProps = {
  open: boolean;
  onClose: () => void;
  /** Items ya filtrados por entitlements: la paleta nunca ofrece lo que el plan no incluye. */
  items: { group: string; item: DealerNavItem }[];
};

/** Minusculas sin tildes, para que "operacion" encuentre "Operación". */
function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

/**
 * Paleta de comandos del dealer (ficha 1.4).
 *
 * Solo navegacion: no consulta al backend, porque no existe endpoint de busqueda
 * del dealer. Nunca ofrece resultados inventados.
 * A11y: role="dialog" + aria-modal, foco atrapado, Esc cierra, flechas y Enter
 * navegan, y el foco vuelve al disparador al cerrar.
 */
export function DealerCommandPalette({ open, onClose, items }: DealerCommandPaletteProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);
  const listboxId = "dealer-command-palette-results";

  const results = useMemo(() => {
    const q = normalize(query.trim());
    if (!q) return items;
    return items.filter(
      (entry) => normalize(entry.item.label).includes(q) || normalize(entry.group).includes(q),
    );
  }, [items, query]);

  useEffect(() => {
    setActive(0);
  }, [query, open]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    const timer = window.setTimeout(() => inputRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  const go = useCallback(
    (href: string) => {
      onClose();
      router.push(href);
    },
    [onClose, router],
  );

  const onKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((i) => (results.length === 0 ? 0 : (i + 1) % results.length));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((i) => (results.length === 0 ? 0 : (i - 1 + results.length) % results.length));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      const target = results[active];
      if (target) go(target.item.href);
      return;
    }
    // Foco atrapado: Tab cicla dentro del dialogo.
    if (event.key === "Tab") {
      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>(
        'input, button, [href], [tabindex]:not([tabindex="-1"])',
      );
      if (!focusables || focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      }
    }
  };

  if (!open) return null;

  return (
    <div
      data-portal="dealer-modal"
      className="fixed inset-0 z-[60] flex items-start justify-center bg-slate-900/60 p-4 pt-[12vh] backdrop-blur-sm"
      onKeyDown={onKeyDown}
    >
      <button
        type="button"
        aria-label="Cerrar buscador"
        onClick={onClose}
        className="absolute inset-0 cursor-default"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Buscar en el panel"
        className="relative z-10 w-full max-w-lg overflow-hidden rounded-[var(--r)] bg-[var(--nav-bg)] text-[var(--nav-fg)] shadow-[var(--shadow-lg)]"
      >
        <div className="flex items-center gap-3 border-b border-[var(--nav-border)] px-4">
          <Search className="h-4 w-4 shrink-0 text-[var(--nav-fg-muted)]" aria-hidden="true" />
          <label htmlFor="dealer-command-input" className="sr-only">
            Buscar una pantalla del panel
          </label>
          <input
            id="dealer-command-input"
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            role="combobox"
            aria-expanded="true"
            aria-controls={listboxId}
            aria-autocomplete="list"
            placeholder="Buscar una pantalla…"
            className="min-h-12 w-full bg-transparent text-sm text-white placeholder:text-[var(--nav-fg-muted)] focus:outline-none"
          />
        </div>

        <ul
          id={listboxId}
          role="listbox"
          aria-label="Resultados"
          className="max-h-[50vh] overflow-y-auto p-2"
        >
          {results.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-[var(--nav-fg-muted)]">
              Ninguna pantalla coincide con esa búsqueda.
            </li>
          ) : (
            results.map((entry, index) => {
              const Icon = entry.item.icon;
              return (
                <li key={entry.item.href} role="option" aria-selected={index === active}>
                  <button
                    type="button"
                    onMouseEnter={() => setActive(index)}
                    onClick={() => go(entry.item.href)}
                    className={cn(
                      "flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left text-sm",
                      index === active
                        ? "bg-[var(--nav-bg-2)] text-white"
                        : "text-[var(--nav-fg-muted)] hover:bg-white/[0.06]",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span className="truncate font-medium text-current">{entry.item.label}</span>
                    <span className="ml-auto shrink-0 text-[11px] uppercase tracking-wide text-[var(--nav-fg-muted)]">
                      {entry.group}
                    </span>
                  </button>
                </li>
              );
            })
          )}
        </ul>

        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--nav-border)] px-4 py-2 text-[11px] text-[var(--nav-fg-muted)]">
          <span>&uarr;&darr; moverse</span>
          <span>&crarr; abrir</span>
          <span>Esc cerrar</span>
        </div>
      </div>
    </div>
  );
}
