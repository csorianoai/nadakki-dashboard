import type { CSSProperties } from "react";

/**
 * Tokens `--forge-*` para lo que se abre DESDE la barra común (selector de tenant, menú de usuario y Ctrl K), ROP-UX-F3-FIX.
 *
 * Esos componentes (TenantSwitcher, UserMenu, CommandPalette) pintan con `bg-forgeSurface-card`, `text-forgeGray-800`… y los
 * tokens solo existen dentro de `.forge-app` (styles/forge-tokens-v2.css). La barra común no está dentro de `.forge-app` en
 * ningún módulo: sin estos valores el panel quedaba transparente y el texto heredaba el zinc-100 de BarraSuite, ilegible sobre el
 * contenido claro de Realtor. Aquí se fijan en la paleta oscura de la barra (zinc), con fondo opaco.
 *
 * Contraste (WCAG, calculado): gris 800 #f4f4f5 16.1:1 sobre la tarjeta y 13.6:1 sobre el hundido; gris 500/400 #a1a1aa 6.9:1 y
 * 5.8:1; marca 700 #7dd3fc 10.6:1 y 8.9:1; iniciales #fafafa sobre marca 600 #0369a1 5.7:1; sobre la barra (#09090b) el gris 800
 * da 18.1:1 y el 500, 7.8:1. Borde gris 200 #71717a: 4.1:1 sobre la barra y 3.7:1 sobre la tarjeta (≥3:1, no texto).
 */
export const TOKENS_PANEL_BARRA = {
  "--forge-surface-card": "#18181b",
  "--forge-surface-sunken": "#27272a",
  "--forge-surface-overlay": "rgba(9, 9, 11, 0.7)",
  "--forge-gray-50": "#fafafa",
  "--forge-gray-100": "#3f3f46",
  "--forge-gray-200": "#71717a",
  "--forge-gray-400": "#a1a1aa",
  "--forge-gray-500": "#a1a1aa",
  "--forge-gray-800": "#f4f4f5",
  "--forge-brand-500": "#38bdf8",
  "--forge-brand-600": "#0369a1",
  "--forge-brand-700": "#7dd3fc",
  "--forge-text-xs": "11px",
  "--forge-text-sm": "13px",
  "--forge-leading-normal": "1.5",
} as CSSProperties;
