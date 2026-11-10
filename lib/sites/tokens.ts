/**
 * Unico sitio con colores y medidas de "Mi web". Valores iniciales copiados de lib/realtor/tokens.ts (opcion 1 de
 * docs/design/sites/DECISION-SISTEMA-VISUAL.md, decision abierta): cambiar de sistema visual = cambiar este fichero.
 */
export const ST = {
  ink: "#13202B",
  muted: "#4A5A68",
  line: "#DCE2E8",
  /** Borde de campos y botones: 4.36:1 sobre blanco (WCAG 1.4.11). */
  control: "#6B7B89",
  page: "#F3F5F7",
  white: "#FFFFFF",
  teal: "#0B6E78",
  demoBg: "#FFF1D6",
  demoText: "#6E4300",
  calloutBg: "#EAF4F5",
  calloutLine: "#CFE3E6",
  okBg: "#E3F4EA",
  okText: "#0B5A32",
  badBg: "#FBE7E4",
  badText: "#8A2418",
  warnBg: "#FFF1D6",
  warnText: "#6E4300",
  neutralBg: "#E8EEF2",
  neutralText: "#13202B",
} as const;

export const SIZE = {
  /** Objetivo tactil minimo (WCAG 2.5.5 / AA del proyecto). */
  target: 44,
  radius: 8,
  gap: 16,
  pad: 24,
  fontBase: 16,
  fontSmall: 14,
  fontTitle: 28,
  fontSub: 20,
  maxWidth: 1080,
  focusWidth: 3,
} as const;

export const FONT = "'IBM Plex Sans', Arial, sans-serif";
