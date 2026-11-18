// Fuentes locales de Baylara (layout.js:6-21): Cormorant Garamond 500 y Manrope 400-700, servidas same-origin (CSP font-src -> default 'self').
export const FONT_FILES: Readonly<Record<string, true>> = {
  'cormorant-garamond-latin-500-normal.woff2': true,
  'manrope-latin-wght-normal.woff2': true,
};

const face = (family: string, weight: string, file: string): string =>
  `@font-face{font-family:'${family}';font-style:normal;font-weight:${weight};font-display:swap;src:url(/fonts/${file}) format('woff2');}`;

export function fontFaceCss(): string {
  return [
    face('Cormorant Garamond', '500', 'cormorant-garamond-latin-500-normal.woff2'),
    face('Manrope', '400 700', 'manrope-latin-wght-normal.woff2'),
    ":root{--font-serif:'Cormorant Garamond','Times New Roman',serif;--font-sans:'Manrope','Helvetica Neue',Arial,sans-serif;}",
  ].join('');
}
