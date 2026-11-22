import { RT } from "@/lib/realtor/tokens";

/**
 * Hoja de estilo del centro (prefijo .sc, sin tocar estilos globales): foco visible de 3 px RT.teal,
 * semana con scroll horizontal propio (columnas ≥146 px, ~150 px a 768 px) y lista vertical de días a ≤480 px.
 */
export const SC_CSS = [
  `.sc{padding:28px 28px 40px;min-width:0}`,
  `.sc :is(button,select,input,textarea,a,[tabindex]):focus-visible{outline:3px solid ${RT.teal};outline-offset:2px}`,
  `.sc-scroll{overflow-x:auto;overscroll-behavior-x:contain;padding:2px 2px 6px;max-width:100%}`,
  `.sc-grid{display:grid;gap:8px;grid-template-columns:repeat(7,minmax(146px,1fr));align-items:start}`,
  `.sc-day{min-height:180px;min-width:0}`,
  `.sc-clamp2{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;overflow-wrap:anywhere}`,
  `.sc-menuitem:hover,.sc-menuitem:focus{background:${RT.calloutBg}}`,
  `.sc h1{overflow-wrap:anywhere}`,
  `@media (max-width:480px){.sc{padding:20px 16px 32px}.sc-scroll{overflow-x:visible}`
    + `.sc-grid{display:flex;flex-direction:column;gap:10px}.sc-day{min-height:0}.sc-head{flex-direction:column}}`,
].join("");
