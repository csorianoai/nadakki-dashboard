import type { CSSProperties } from "react";

/**
 * Tokens `--forge-*` para Contabilidad (MF3-T3: Plan de cuentas, Libro mayor, Asientos y Balance).
 *
 * Esas pantallas pintan con componentes Forge (Button, Input, Select, Modal) que usan `text-forgeGray-800`,
 * `bg-forgeSurface-card`… y los tokens solo existen dentro de `.forge-app` (styles/forge-tokens-v2.css). Contable vive
 * fuera, sobre el fondo oscuro del Blueprint (`.ndk-page`, #0a0f1c, igual en tema claro y oscuro): sin tokens el campo
 * quedaba transparente y el texto heredaba el blanco de la página. Se fijan aquí con la paleta oscura (zinc), fondo opaco.
 *
 * Contraste (WCAG): gris 800 #f4f4f5 sobre tarjeta #18181b 16.1:1; gris 700 #d4d4d8 sobre página 13.3:1; gris 500 #a1a1aa
 * sobre página 7.2:1; gris 50 #fafafa sobre marca 500 #0369a1 5.9:1 y sobre peligro 500 #b91c1c 6.5:1.
 * Nota: la variante `link` de Button (texto marca 600) no es legible en esta paleta; Contable no la usa.
 */
export const TOKENS_CONTABLE = {
  "--forge-surface-card": "#18181b",
  "--forge-surface-sunken": "#27272a",
  "--forge-surface-overlay": "rgba(9, 9, 11, 0.7)",
  "--forge-gray-50": "#fafafa",
  "--forge-gray-100": "#3f3f46",
  "--forge-gray-200": "#71717a",
  "--forge-gray-300": "#a1a1aa",
  "--forge-gray-400": "#a1a1aa",
  "--forge-gray-500": "#a1a1aa",
  "--forge-gray-700": "#d4d4d8",
  "--forge-gray-800": "#f4f4f5",
  "--forge-brand-500": "#0369a1",
  "--forge-brand-600": "#075985",
  "--forge-brand-700": "#0c4a6e",
  "--forge-danger-500": "#b91c1c",
  "--forge-danger-700": "#991b1b",
  "--forge-danger-800": "#7f1d1d",
  "--forge-text-xs": "11px",
  "--forge-text-sm": "13px",
  "--forge-text-md": "15px",
  "--forge-leading-normal": "1.5",
} as CSSProperties;
