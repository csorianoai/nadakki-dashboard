import type { CSSProperties } from "react";
import { dccThemeStyle, type DccTheme } from "@/lib/dcc/tokens";

/**
 * El DealerShell sobre los tokens del DCC (lib/dcc/tokens.ts).
 *
 * Solo visual: las variables que ya consumen sidebar, topbar y paleta
 * (`--nav-*`, `--bg`, `--surface*`, `--fg*`, `--brand*`, `--ring`) se
 * redefinen en la raiz del shell apuntando a los tokens claro/oscuro. No se
 * toca app/globals.css: el estilo inline gana sobre `[data-portal="dealer"]`
 * solo dentro de este nodo. Roles: barra lateral marina, item activo dorado,
 * foco turquesa; el contenido sigue en lienzo claro con tarjetas blancas.
 */
const LEGADO: Record<string, string> = {
  "--bg": "var(--dcc-canvas)",
  "--surface": "var(--dcc-surface)",
  "--surface-2": "var(--dcc-surface-muted)",
  "--surface-3": "var(--dcc-surface-muted)",
  "--border": "var(--dcc-border-strong)",
  "--border-2": "var(--dcc-border-strong)",
  "--fg": "var(--dcc-fg)",
  "--fg-muted": "var(--dcc-fg-muted)",
  "--fg-subtle": "var(--dcc-fg-subtle)",
  "--brand": "var(--dcc-action)",
  "--brand-2": "var(--dcc-action)",
  "--brand-strong": "var(--dcc-action-hover)",
  "--on-brand": "var(--dcc-on-action)",
  "--ring": "var(--dcc-focus)",
  "--shadow-sm": "var(--dcc-shadow)",
  // Barra lateral MARINA (decision de Cesar): no pasa a blanco.
  "--nav-bg": "var(--dcc-navy)",
  "--nav-bg-2": "var(--dcc-navy-2)",
  "--nav-fg": "var(--dcc-on-navy)",
  "--nav-fg-muted": "var(--dcc-on-navy-muted)",
  "--nav-border": "var(--dcc-navy-2)",
};

export const DEALER_SHELL_VARIABLES_LEGADO = Object.keys(LEGADO);

export function dealerShellThemeStyle(theme: DccTheme): CSSProperties {
  return { ...dccThemeStyle(theme), ...LEGADO } as CSSProperties;
}
