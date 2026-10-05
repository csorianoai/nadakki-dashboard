import type { CSSProperties } from "react";

/**
 * Tokens del Dealer Command Center como variables CSS (no toca app/globals.css).
 *
 * ROLES FIJOS (decision de Cesar, R1; sustituye "un solo color azul"):
 *  - Marino casi negro: barra lateral, boton principal y titulos.
 *  - Dorado: item activo del menu, filo superior de tarjetas clave, cifras
 *    principales y acentos de marca.
 *  - Turquesa: acciones secundarias y enlaces, "En vivo", variaciones
 *    positivas e iconos de seccion.
 *  - Estado (solo calidad y riesgo): verde verificado, AMBAR ANARANJADO
 *    parcial (distinto del dorado), rojo riesgo, gris bloqueado.
 *
 * CONTRASTE AA (lib/dcc/tests/contraste.test.ts): el dorado #C9A227 y el
 * turquesa #0EA5A4 no llegan a 4,5:1 sobre blanco; sobre superficies claras el
 * TEXTO usa sus variantes `-ink`, y los tonos puros quedan para filos, iconos y
 * fondos. La lamina docs/design/DCC_TOKENS_LAMINA.html se genera desde aqui.
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
  "--dcc-border": "#E6EAF0",
  "--dcc-border-strong": "#D5DCE5",
  "--dcc-fg": "#0B1220",
  "--dcc-fg-muted": "#475467",
  "--dcc-fg-subtle": "#5B6577",
  "--dcc-navy": "#0B1220",
  "--dcc-on-navy": "#FFFFFF",
  "--dcc-on-navy-muted": "#A9B4C8",
  "--dcc-navy-2": "#17223A",
  "--dcc-action": "#0B1220",
  "--dcc-action-hover": "#17223A",
  "--dcc-on-action": "#FFFFFF",
  "--dcc-focus": "0 0 0 3px rgba(14, 165, 164, 0.45)",
  "--dcc-shadow": "0 1px 2px rgba(16, 24, 40, 0.06), 0 1px 3px rgba(16, 24, 40, 0.08)",
  "--dcc-gold": "#C9A227",
  "--dcc-gold-ink": "#8A6A10",
  "--dcc-gold-bg": "#FBF4E2",
  "--dcc-on-gold": "#0B1220",
  "--dcc-teal": "#0EA5A4",
  "--dcc-teal-ink": "#0F766E",
  "--dcc-teal-bg": "#E6F6F6",
  "--dcc-ok-fg": "#067647",
  "--dcc-ok-bg": "#ECFDF3",
  "--dcc-ok-line": "#ABEFC6",
  "--dcc-partial-fg": "#C2410C",
  "--dcc-partial-bg": "#FFF4ED",
  "--dcc-partial-line": "#FDBA8C",
  "--dcc-blocked-fg": "#475467",
  "--dcc-blocked-bg": "#F2F4F7",
  "--dcc-blocked-line": "#D0D5DD",
  "--dcc-na-fg": "#5B6577",
  "--dcc-na-border": "#D5DCE5",
  "--dcc-error-fg": "#B42318",
  "--dcc-error-bg": "#FEF3F2",
} as const;

export type DccTokenKey = keyof typeof LIGHT;

export const DCC_TOKENS: Record<DccTheme, Record<DccTokenKey, string>> = {
  light: LIGHT,
  dark: {
    ...COMUNES,
    "--dcc-canvas": "#141C28",
    "--dcc-surface": "#111A2B",
    "--dcc-surface-muted": "#162236",
    "--dcc-border": "#24314F",
    "--dcc-border-strong": "#34435A",
    "--dcc-fg": "#E8EDF4",
    "--dcc-fg-muted": "#B1BBCA",
    "--dcc-fg-subtle": "#9AA6B8",
    "--dcc-navy": "#070C17",
    "--dcc-on-navy": "#F1F5F9",
    "--dcc-on-navy-muted": "#A9B4C8",
    "--dcc-navy-2": "#111A2A",
    "--dcc-action": "#E8EDF4",
    "--dcc-action-hover": "#FFFFFF",
    "--dcc-on-action": "#0B1220",
    "--dcc-focus": "0 0 0 3px rgba(45, 212, 191, 0.45)",
    "--dcc-shadow": "0 1px 2px rgba(0, 0, 0, 0.28)",
    "--dcc-gold": "#E2B857",
    "--dcc-gold-ink": "#E2B857",
    "--dcc-gold-bg": "rgba(226, 184, 87, 0.12)",
    "--dcc-on-gold": "#0B1220",
    "--dcc-teal": "#2DD4BF",
    "--dcc-teal-ink": "#5EEAD4",
    "--dcc-teal-bg": "rgba(45, 212, 191, 0.12)",
    "--dcc-ok-fg": "#62C79F",
    "--dcc-ok-bg": "rgba(98, 199, 159, 0.11)",
    "--dcc-ok-line": "rgba(98, 199, 159, 0.32)",
    "--dcc-partial-fg": "#FF8552",
    "--dcc-partial-bg": "rgba(255, 133, 82, 0.12)",
    "--dcc-partial-line": "rgba(255, 133, 82, 0.36)",
    "--dcc-blocked-fg": "#A8B1C0",
    "--dcc-blocked-bg": "rgba(168, 177, 192, 0.09)",
    "--dcc-blocked-line": "rgba(168, 177, 192, 0.30)",
    "--dcc-na-fg": "#9AA6B8",
    "--dcc-na-border": "#34435A",
    "--dcc-error-fg": "#F08C78",
    "--dcc-error-bg": "rgba(240, 140, 120, 0.11)",
  },
};

/** Estilo inline con las variables del tema, para el contenedor raiz. */
export function dccThemeStyle(theme: DccTheme): CSSProperties {
  return { ...DCC_TOKENS[theme] } as CSSProperties;
}

export const DCC_TOKEN_KEYS = Object.keys(LIGHT) as DccTokenKey[];
