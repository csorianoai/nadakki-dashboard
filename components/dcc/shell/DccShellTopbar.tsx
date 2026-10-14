"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight, LogOut, Menu, Moon, Sun } from "lucide-react";
import type { DccTheme } from "@/lib/dcc/tokens";
import { DCC_CLASSES } from "@/components/dcc/clases";
import type { DccMiga, DccUsuario } from "./DccShell";

/** Barra superior del shell DCC: migas, extras (buscador, campana), conmutador de tema, usuario y salir. */
export function DccShellTopbar({
  migas,
  usuario,
  theme,
  onTheme,
  onMenu,
  onSalir,
  extras,
}: {
  migas: DccMiga[];
  usuario: DccUsuario;
  theme: DccTheme;
  onTheme: (t: DccTheme) => void;
  onMenu: () => void;
  onSalir?: () => void;
  extras?: ReactNode;
}) {
  const siguiente: DccTheme = theme === "light" ? "dark" : "light";
  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b border-[var(--dcc-border)] bg-[var(--dcc-surface)] px-4 sm:px-5 lg:px-6">
      <button type="button" aria-label="Abrir menú" onClick={onMenu} className={`${DCC_CLASSES.quietButton} lg:hidden`}>
        <Menu className="h-4 w-4" aria-hidden="true" />
      </button>
      <nav aria-label="Ruta" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1.5 text-sm">
          {migas.map((miga, i) => {
            const ultima = i === migas.length - 1;
            return (
              <li key={`${miga.label}-${i}`} className="flex min-w-0 items-center gap-1.5">
                {i > 0 ? <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[var(--dcc-fg-subtle)]" aria-hidden="true" /> : null}
                {miga.href && !ultima ? (
                  <Link href={miga.href} className="min-h-0 truncate text-[var(--dcc-fg-subtle)] hover:text-[var(--dcc-fg)]">
                    {miga.label}
                  </Link>
                ) : (
                  <span aria-current={ultima ? "page" : undefined} className={`truncate ${ultima ? "font-semibold text-[var(--dcc-fg)]" : "text-[var(--dcc-fg-subtle)]"}`}>
                    {miga.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      {extras}
      <button
        type="button"
        data-testid="dcc-shell-theme"
        aria-label={siguiente === "dark" ? "Cambiar a tema oscuro" : "Cambiar a tema claro"}
        onClick={() => onTheme(siguiente)}
        className={DCC_CLASSES.quietButton}
      >
        {theme === "light" ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
      </button>
      <div className="flex min-w-0 items-center gap-2.5">
        <span aria-hidden="true" className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[var(--dcc-teal-bg)] text-xs font-semibold text-[var(--dcc-teal-ink)]">
          {usuario.iniciales}
        </span>
        <span className="hidden min-w-0 flex-col leading-tight sm:flex">
          <span className="truncate text-sm font-medium">{usuario.nombre}</span>
          {usuario.rol ? <span className="truncate text-[11px] text-[var(--dcc-fg-subtle)]">{usuario.rol}</span> : null}
        </span>
      </div>
      {onSalir ? (
        <button type="button" onClick={onSalir} aria-label="Cerrar sesión" title="Cerrar sesión" className={DCC_CLASSES.quietButton}>
          <LogOut className="h-4 w-4" aria-hidden="true" />
        </button>
      ) : null}
    </header>
  );
}
