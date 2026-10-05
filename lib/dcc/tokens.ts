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

const LIGHT = {
  ...COMUNES,
  "--dcc-canvas": "#F5F7FA",
  "--dcc-surface": "#FFFFFF",
  "--dcc-surface-muted": "#F8FAFC",
  "--dcc-border": "rgba(15, 23, 42, 0.06)",
  "--dcc-border-strong": "#E2E8F0",
  "--dcc-fg": "#0F172A",
  "--dcc-fg-muted": "#475569",
  "--dcc-fg-subtle": "#64748B",
  "--dcc-action": "#2563EB",
  "--dcc-action-hover": "#1D4ED8",
  "--dcc-on-action": "#FFFFFF",
  "--dcc-focus": "0 0 0 3px rgba(37, 99, 235, 0.35)",
  "--dcc-shadow": "0 1px 2px rgba(15, 23, 42, 0.04), 0 1px 3px rgba(15, 23, 42, 0.03)",
  "--dcc-ok-fg": "#15803D",
  "--dcc-ok-bg": "#ECFDF3",
  "--dcc-partial-fg": "#B45309",
  "--dcc-partial-bg": "#FFFAEB",
  "--dcc-blocked-fg": "#475569",
  "--dcc-blocked-bg": "#F1F5F9",
  "--dcc-na-fg": "#64748B",
  "--dcc-na-border": "#CBD5E1",
  "--dcc-error-fg": "#B42318",
  "--dcc-error-bg": "#FEF3F2",
  } as const;

export type DccTokenKey = keyof typeof LIGHT;

export const DCC_TOKENS: Record<DccTheme, Record<DccTokenKey, string>> = {
  light: LIGHT,
  dark: {
    ...COMUNES,
    "--dcc-canvas": "#0B1220",
    "--dcc-surface": "#111A2B",
    "--dcc-surface-muted": "#162236",
    "--dcc-border": "rgba(148, 163, 184, 0.14)",
    "--dcc-border-strong": "#24314F",
    "--dcc-fg": "#E2E8F0",
    "--dcc-fg-muted": "#A8B3C5",
    "--dcc-fg-subtle": "#8593A8",
    "--dcc-action": "#3B82F6",
    "--dcc-action-hover": "#60A5FA",
    "--dcc-on-action": "#FFFFFF",
    "--dcc-focus": "0 0 0 3px rgba(96, 165, 250, 0.45)",
    "--dcc-shadow": "0 1px 2px rgba(0, 0, 0, 0.30)",
    "--dcc-ok-fg": "#4ADE80",
    "--dcc-ok-bg": "rgba(34, 197, 94, 0.12)",
    "--dcc-partial-fg": "#FBBF24",
    "--dcc-partial-bg": "rgba(245, 158, 11, 0.12)",
    "--dcc-blocked-fg": "#A8B3C5",
    "--dcc-blocked-bg": "rgba(148, 163, 184, 0.12)",
    "--dcc-na-fg": "#8593A8",
    "--dcc-na-border": "#334155",
    "--dcc-error-fg": "#F87171",
    "--dcc-error-bg": "rgba(239, 68, 68, 0.12)",
  },
};

/** Estilo inline con las variables del tema, para el contenedor raiz. */
export function dccThemeStyle(theme: DccTheme): CSSProperties {
  return { ...DCC_TOKENS[theme] } as CSSProperties;
}

export const DCC_TOKEN_KEYS = Object.keys(LIGHT) as DccTokenKey[];
