import { DCC_TOKENS, type DccTheme, type DccTokenKey } from "@/lib/dcc/tokens";

/** Contraste WCAG 2.x entre dos colores hex opacos. */
function contraste(a: string, b: string): number {
  const lum = (h: string) => {
    const [r, g, bl] = (h.replace("#", "").match(/../g) ?? []).map((x) => {
      const c = parseInt(x, 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

/** [texto, fondo, minimo]. 4,5 = texto normal AA; 3 = icono o texto grande. */
const PARES: [DccTokenKey, DccTokenKey, number][] = [
  ["--dcc-on-navy", "--dcc-navy", 4.5],
  ["--dcc-on-navy-muted", "--dcc-navy", 4.5],
  ["--dcc-gold", "--dcc-navy", 4.5],
  ["--dcc-on-gold", "--dcc-gold", 4.5],
  ["--dcc-on-action", "--dcc-action", 4.5],
  ["--dcc-fg", "--dcc-surface", 4.5],
  ["--dcc-fg", "--dcc-canvas", 4.5],
  ["--dcc-fg-muted", "--dcc-surface", 4.5],
  ["--dcc-fg-subtle", "--dcc-surface", 4.5],
  ["--dcc-gold-ink", "--dcc-surface", 4.5],
  ["--dcc-teal-ink", "--dcc-surface", 4.5],
  ["--dcc-teal", "--dcc-surface", 3],
  ["--dcc-ok-fg", "--dcc-surface", 4.5],
  ["--dcc-partial-fg", "--dcc-surface", 4.5],
  ["--dcc-blocked-fg", "--dcc-surface", 4.5],
  ["--dcc-error-fg", "--dcc-surface", 4.5],
];

describe.each(["light", "dark"] as DccTheme[])("contraste AA (%s)", (theme) => {
  it.each(PARES)("%s sobre %s >= %d:1", (texto, fondo, minimo) => {
    expect(contraste(DCC_TOKENS[theme][texto], DCC_TOKENS[theme][fondo])).toBeGreaterThanOrEqual(minimo);
  });
});

describe("el ambar de 'parcial' no se confunde con el dorado", () => {
  it.each(["light", "dark"] as DccTheme[])("%s: tonos separados al menos 15 grados", (theme) => {
    const tono = (h: string) => {
      const [r, g, b] = (h.replace("#", "").match(/../g) ?? []).map((x) => parseInt(x, 16) / 255);
      const max = Math.max(r, g, b);
      const d = max - Math.min(r, g, b);
      const base = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
      return (base * 60 + 360) % 360;
    };
    const t = DCC_TOKENS[theme];
    expect(Math.abs(tono(t["--dcc-gold"]) - tono(t["--dcc-partial-fg"]))).toBeGreaterThanOrEqual(15);
  });
});
