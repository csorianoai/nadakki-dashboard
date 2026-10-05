import type { CSSProperties } from "react";

/**
 * Tokens del Dealer Command Center (R1), como variables CSS del contenedor v2.
 * No toca app/globals.css ni [data-portal="dealer"]. Tema claro principal (lienzo
 * gris, tarjetas blancas, sin bloques oscuros), un solo color de accion (azul); el
 * oscuro redefine exactamente las mismas claves.
 */

export type DccTheme = "light" | "dark";

const COMUNES = {
  "--dcc-radius": "12px",
  "--dcc-gap": "20px",
  "--dcc-pad": "20px",
} as const;

/**
 * Valores de la referencia v3 (docs/design/DCC_REFERENCIA_v3.html, tabla
 * "Tokens de color · Dealer OS", generada desde gen_tokens.py). Los tokens de
 * zona oscura de la referencia (--ink*, barra superior negra) NO se traen: en
 * el tema claro no hay bloques oscuros (correccion de Cesar).
 */
const LIGHT = {
  ...COMUNES,
  "--dcc-canvas": "#EEF2F7",
  "--dcc-surface": "#FFFFFF",
  "--dcc-surface-muted": "#F8FAFC",
  "--dcc-border": "#E6EAF0",
  "--dcc-border-strong": "#D5DCE5",
  "--dcc-fg": "#0F172A",
  "--dcc-fg-muted": "#64748B",
  "--dcc-fg-subtle": "#64748B",
  "--dcc-action": "#1D4ED8",
  "--dcc-action-hover": "#1E40AF",
  "--dcc-on-action": "#FFFFFF",
  "--dcc-focus": "0 0 0 3px rgba(29, 78, 216, 0.30)",
  "--dcc-shadow": "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.08)",
  "--dcc-ok-fg": "#067647",
  "--dcc-ok-bg": "#ECFDF3",
  "--dcc-ok-line": "#ABEFC6",
  "--dcc-partial-fg": "#B54708",
  "--dcc-partial-bg": "#FFFAEB",
  "--dcc-partial-line": "#FEDF89",
  "--dcc-blocked-fg": "#475467",
  "--dcc-blocked-bg": "#F2F4F7",
  "--dcc-blocked-line": "#D0D5DD",
  "--dcc-na-fg": "#64748B",
  "--dcc-na-border": "#D5DCE5",
  "--dcc-error-fg": "#B42318",
  "--dcc-error-bg": "#FEF3F2",
  "--dcc-blue-ink": "#1E40AF",
  "--dcc-blue-bg": "#EEF3FF",
  "--dcc-blue-line": "#C7D6FB",
  "--dcc-gold-ink": "#8A6116",
  "--dcc-gold-bg": "#FBF4E2",
  "--dcc-gold-line": "#EBD49C",
} as const;

export type DccTokenKey = keyof typeof LIGHT;

export const DCC_TOKENS: Record<DccTheme, Record<DccTokenKey, string>> = {
  light: LIGHT,
  dark: {
    ...COMUNES,
    "--dcc-canvas": "#141C28",
    "--dcc-surface": "#1A2331",
    "--dcc-surface-muted": "#202A39",
    "--dcc-border": "#283447",
    "--dcc-border-strong": "#34435A",
    "--dcc-fg": "#E8EDF4",
    "--dcc-fg-muted": "#B1BBCA",
    "--dcc-fg-subtle": "#8E9AAC",
    "--dcc-action": "#84AAEA",
    "--dcc-action-hover": "#A9C4F5",
    "--dcc-on-action": "#0B1018",
    "--dcc-focus": "0 0 0 3px rgba(132, 170, 234, 0.40)",
    "--dcc-shadow": "0 1px 2px rgba(0, 0, 0, 0.28)",
    "--dcc-ok-fg": "#62C79F",
    "--dcc-ok-bg": "rgba(98, 199, 159, 0.11)",
    "--dcc-ok-line": "rgba(98, 199, 159, 0.32)",
    "--dcc-partial-fg": "#E6B85F",
    "--dcc-partial-bg": "rgba(230, 184, 95, 0.11)",
    "--dcc-partial-line": "rgba(230, 184, 95, 0.34)",
    "--dcc-blocked-fg": "#A8B1C0",
    "--dcc-blocked-bg": "rgba(168, 177, 192, 0.09)",
    "--dcc-blocked-line": "rgba(168, 177, 192, 0.30)",
    "--dcc-na-fg": "#8E9AAC",
    "--dcc-na-border": "#34435A",
    "--dcc-error-fg": "#F08C78",
    "--dcc-error-bg": "rgba(240, 140, 120, 0.11)",
    "--dcc-blue-ink": "#A9C4F5",
    "--dcc-blue-bg": "rgba(132, 170, 234, 0.12)",
    "--dcc-blue-line": "rgba(132, 170, 234, 0.34)",
    "--dcc-gold-ink": "#E2B857",
    "--dcc-gold-bg": "rgba(226, 184, 87, 0.12)",
    "--dcc-gold-line": "rgba(226, 184, 87, 0.36)",
  },
};

/** Estilo inline con las variables del tema, para el contenedor raiz. */
export function dccThemeStyle(theme: DccTheme): CSSProperties {
  return { ...DCC_TOKENS[theme] } as CSSProperties;
}

export const DCC_TOKEN_KEYS = Object.keys(LIGHT) as DccTokenKey[];
