/**
 * Tema claro del Core Legal: todo color de texto o ícono de la paleta tiene contraste ≥ 4.5:1 (WCAG 2.1 AA)
 * sobre cada fondo del tema (blanco, tarjeta, elevado y el resaltado de la opción activa).
 */
import fs from "fs";
import path from "path";

const css = fs.readFileSync(path.join(process.cwd(), "styles/legal-claro.css"), "utf8");
const vars = Object.fromEntries(Array.from(css.matchAll(/--(lc-[a-z0-9-]+):\s*(#[0-9a-f]{6})/gi)).map((m) => [m[1], m[2]]));

function lum(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const f = (c: number) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
const contraste = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

const FONDOS = ["lc-fondo", "lc-tarjeta", "lc-elevado", "lc-resaltado"];
const NO_TEXTO = new Set([...FONDOS, "lc-borde", "lc-acento-borde"]);

test("la paleta se leyó del CSS", () => {
  expect(Object.keys(vars).length).toBeGreaterThan(20);
});

test.each(Object.keys(vars).filter((k) => !NO_TEXTO.has(k)))("%s ≥ 4.5:1 sobre todos los fondos", (k) => {
  for (const f of FONDOS) expect(contraste(vars[k], vars[f])).toBeGreaterThanOrEqual(4.5);
});

test("el borde de la opción activa se distingue (≥ 3:1, no es texto)", () => {
  for (const f of ["lc-fondo", "lc-tarjeta"]) expect(contraste(vars["lc-acento-borde"], vars[f])).toBeGreaterThanOrEqual(3);
});
