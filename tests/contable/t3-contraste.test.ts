/**
 * MF3-T3 — Plan de cuentas, Libro mayor, Asientos y Balance: el texto tenia el color del fondo.
 *
 * Causa: estas pantallas pintan con componentes Forge (Button, Input, Select, Modal) que usan
 * `text-forgeGray-800`, `bg-forgeSurface-card`... y esos tokens `--forge-*` solo existen dentro de `.forge-app`
 * (styles/forge-tokens-v2.css). Contable vive fuera, sobre el fondo oscuro del Blueprint: sin tokens, el fondo del
 * campo es transparente y el texto hereda el blanco de la pagina. El layout debe fijarlos (TOKENS_CONTABLE).
 * La superficie es oscura en tema claro y oscuro, asi que la misma paleta sirve a los dos.
 */
import fs from "node:fs";
import path from "node:path";

import { TOKENS_CONTABLE } from "@/components/contable/tokens-contable";

const RAIZ = path.resolve(__dirname, "../..");
const leer = (rel: string) => fs.readFileSync(path.join(RAIZ, rel), "utf8");
const tok = TOKENS_CONTABLE as Record<string, string>;

function rgb(hex: string): [number, number, number] {
  const m = /^#([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) throw new Error(`no es #rrggbb: ${hex}`);
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lum(hex: string): number {
  const [r, g, b] = rgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contraste(a: string, b: string): number {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
}

const FONDO_PAGINA = "#0a0f1c"; // --bg-primary de .ndk-page (BlueprintProjectsChrome)
const v = (n: string) => tok[n];

const PARES: Array<[string, string, string]> = [
  ["texto de campo sobre tarjeta", v("--forge-gray-800"), v("--forge-surface-card")],
  ["etiqueta de campo sobre la pagina", v("--forge-gray-700"), FONDO_PAGINA],
  ["ayuda de campo sobre la pagina", v("--forge-gray-500"), FONDO_PAGINA],
  ["boton secundario", v("--forge-gray-800"), v("--forge-surface-card")],
  ["boton secundario al pasar el raton", v("--forge-gray-800"), v("--forge-surface-sunken")],
  ["boton fantasma sobre la pagina", v("--forge-gray-700"), FONDO_PAGINA],
  ["boton fantasma al pasar el raton", v("--forge-gray-700"), v("--forge-surface-sunken")],
  ["boton primario", v("--forge-gray-50"), v("--forge-brand-500")],
  ["boton primario al pasar el raton", v("--forge-gray-50"), v("--forge-brand-600")],
  ["boton peligro", v("--forge-gray-50"), v("--forge-danger-500")],
  ["titulo de modal sobre tarjeta", v("--forge-gray-800"), v("--forge-surface-card")],
  ["texto secundario de modal sobre tarjeta", v("--forge-gray-500"), v("--forge-surface-card")],
];

describe("MF3-T3 contable: tokens --forge-* fuera de .forge-app", () => {
  test.each(PARES)("%s >= 4.5:1", (_n, fg, bg) => {
    expect(fg).toBeDefined();
    expect(bg).toBeDefined();
    expect(contraste(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  test("define todo token forge que usan Button, Input, Select y Modal", () => {
    const usados = new Set<string>();
    for (const f of ["Button", "Input", "Select", "Modal"]) {
      const src = leer(`components/forge/ui/${f}.tsx`);
      for (const m of src.matchAll(/forge(Gray|Brand|Danger|Surface)-([a-z0-9]+)/g)) {
        usados.add(`--forge-${m[1].toLowerCase()}-${m[2]}`);
      }
    }
    const faltan = [...usados].filter((t) => !(t in tok)).sort();
    expect(faltan).toEqual([]);
  });
});
