// Tokens de la plantilla Baylara (globals.css:2-17). ESQUEMA DE manifest.theme de esta plantilla: objeto plano
// { navy: '#rrggbb', ..., 'on-navy-2': '#rrggbb', pad: '<medida>', section: '<medida>' }. Lista blanca; invalido -> valor de la plantilla.
// Discrepancia: C-SITES-RENDER deja `theme` como object sin esquema y E6:45 propone otros nombres (color.primary...).
export const THEME_DEFAULTS: Readonly<Record<string, string>> = {
  navy: '#0e2236', ink: '#0e1b27', text: '#33414e', muted: '#4b5966', sand: '#eadfcc', 'sand-light': '#f6f1e8', line: '#e6ded0',
  'line-2': '#d9cfbf', gold: '#a8834a', 'gold-light': '#c9a86a', 'gold-text': '#7a5e2e', mist: '#d6e0e6', 'on-navy': '#d5dee6',
  'on-navy-2': '#c4cdd6', pad: 'clamp(16px, 4vw, 48px)', section: 'clamp(64px, 8vw, 112px)',
};
export const THEME_KEYS = Object.keys(THEME_DEFAULTS);

const HEX = /^#[0-9a-f]{6}$/i;
const PX = /^\d{1,3}px$/;
const CLAMP = /^clamp\(\d{1,3}px, \d{1,2}(?:\.\d{1,2})?vw, \d{1,3}px\)$/;
const MEASURES = new Set(['pad', 'section']);

/** Valores validados: nunca se copia texto libre del manifiesto al CSS. */
export function resolveTheme(theme: unknown): Record<string, string> {
  const src = theme && typeof theme === 'object' && !Array.isArray(theme) ? (theme as Record<string, unknown>) : {};
  const out: Record<string, string> = {};
  for (const k of THEME_KEYS) {
    const v = Object.prototype.hasOwnProperty.call(src, k) ? src[k] : undefined;
    const ok = typeof v === 'string' && (MEASURES.has(k) ? PX.test(v) || CLAMP.test(v) : HEX.test(v));
    out[k] = ok ? (v as string).toLowerCase() : THEME_DEFAULTS[k];
  }
  return out;
}

/** Bloque `:root{...}` del sitio. Se sirve same-origin (la CSP no permite estilos en linea). */
export function themeCss(theme: unknown): string {
  const r = resolveTheme(theme);
  return `:root{${THEME_KEYS.map((k) => `--${k}:${r[k]};`).join('')}}`;
}
