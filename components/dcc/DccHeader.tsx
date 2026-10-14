"use client";

import type { ReactNode } from "react";
import { Moon, Sun } from "lucide-react";
import type { MarcaDcc } from "@/lib/dcc/marca";
import type { DccTheme } from "@/lib/dcc/tokens";
import { DCC_CLASSES } from "./clases";

/**
 * Cabecera de la pagina: titulo, acciones y conmutador de tema. La marca del
 * tenant ya esta en la barra lateral, asi que aqui no se repite; el logo solo
 * aparece si el tenant lo tiene (sin recuadro vacio). Sin `onTheme` no hay
 * conmutador: lo tiene el chrome.
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
  onTheme?: (t: DccTheme) => void;
  acciones?: ReactNode;
}) {
  const siguiente: DccTheme = theme === "light" ? "dark" : "light";
  return (
    <header
      data-testid="dcc-header"
      className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--dcc-border-strong)] bg-[var(--dcc-surface)] px-5 py-4 lg:px-6"
    >
      <div className="flex min-w-0 items-center gap-3">
        {marca.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- logo del tenant, URL externa del branding
          <img data-testid="dcc-logo" src={marca.logoUrl} alt={marca.nombre ?? ""} className="h-8 w-auto max-w-[140px] object-contain" />
        ) : null}
        <h1 className="truncate text-lg font-bold text-[var(--dcc-fg)]">{titulo}</h1>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        {acciones}
        {onTheme ? (
          <button
            type="button"
            data-testid="dcc-theme-toggle"
            onClick={() => onTheme(siguiente)}
            aria-label={siguiente === "dark" ? "Cambiar a tema oscuro" : "Cambiar a tema claro"}
            className={DCC_CLASSES.quietButton}
          >
            {theme === "light" ? <Moon className="h-4 w-4" aria-hidden="true" /> : <Sun className="h-4 w-4" aria-hidden="true" />}
          </button>
        ) : null}
      </div>
    </header>
  );
}
