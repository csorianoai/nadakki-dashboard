"use client";

import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import type { MarcaDcc } from "@/lib/dcc/marca";
import type { DccTheme } from "@/lib/dcc/tokens";
import { DCC_CLASSES } from "./clases";

/**
 * Barra superior blanca con borde inferior sutil. La marca del tenant manda
 * arriba a la izquierda (con hueco para logo); la linea de plataforma va
 * debajo, pequena, y solo si el tenant la trae.
 */
export function DccHeader({
  marca,
  titulo,
  theme,
  onTheme,
  acciones,
}: {
  marca: MarcaDcc;
  titulo: string;
  theme: DccTheme;
  onTheme: (t: DccTheme) => void;
  acciones?: ReactNode;
}) {
  const siguiente: DccTheme = theme === "light" ? "dark" : "light";
  return (
    <header
      data-testid="dcc-header"
      className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--dcc-border-strong)] bg-[var(--dcc-surface)] px-5 py-4 lg:px-6"
    >
      <div className="flex min-w-0 items-center gap-3">
        <div
          data-testid="dcc-logo-slot"
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-[var(--dcc-border-strong)] bg-[var(--dcc-surface-muted)]"
        >
          {marca.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- logo del tenant, URL externa del branding
            <img src={marca.logoUrl} alt="" className="h-full w-full object-contain" />
          ) : null}
        </div>
        <div className="min-w-0">
          <p data-testid="dcc-marca-nombre" className="truncate text-lg font-bold leading-tight text-[var(--dcc-fg)]">
            {marca.nombre ?? ""}
          </p>
          {marca.plataforma ? (
            <p data-testid="dcc-marca-plataforma" className={`text-xs ${DCC_CLASSES.subtle}`}>
              {marca.plataforma}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <h1 className={`mr-2 text-sm font-medium ${DCC_CLASSES.muted}`}>{titulo}</h1>
        {acciones}
        <button
          type="button"
          data-testid="dcc-theme-toggle"
          onClick={() => onTheme(siguiente)}
          aria-label={siguiente === "dark" ? "Cambiar a tema oscuro" : "Cambiar a tema claro"}
          className={DCC_CLASSES.quietButton}
        >
          {theme === "light" ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
        </button>
      </div>
    </header>
  );
}
