/**
 * Guardia de fuentes: ni el build ni el navegador piden nada a Google Fonts.
 *
 * El build de produccion fallaba de forma intermitente en next/font
 * ("Cannot read properties of null (reading '1')") cuando Google respondia 503
 * a la descarga de build. Todas las familias se sirven ahora con
 * next/font/local o @font-face desde lib/fonts/files, con su licencia OFL.
 */
import fs from "fs";
import path from "path";

const RAIZ = path.resolve(__dirname, "../../..");
const CARPETAS = ["app", "components", "lib", "styles"];
const CODIGO = /\.(ts|tsx|js|jsx|css)$/;
const PROHIBIDO = [/next\/font\/google/, /fonts\.googleapis\.com/, /fonts\.gstatic\.com/];

function archivos(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" || e.name === "tests" || e.name === "__tests__" ? [] : archivos(p);
    return CODIGO.test(e.name) && !/\.test\.(ts|tsx)$/.test(e.name) ? [p] : [];
  });
}

/** Quita comentarios para que una mencion historica no cuente como uso. */
function sinComentarios(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'])\/\/.*$/gm, "$1");
}

const TODOS = CARPETAS.flatMap((c) => archivos(path.join(RAIZ, c)));

describe("fuentes sin Google Fonts", () => {
  test("ningun archivo de codigo usa next/font/google ni los dominios de Google Fonts", () => {
    const usos = TODOS.flatMap((f) => {
      const src = sinComentarios(fs.readFileSync(f, "utf8"));
      return PROHIBIDO.filter((re) => re.test(src)).map((re) => `${path.relative(RAIZ, f)} -> ${re}`);
    });
    expect(usos).toEqual([]);
  });

  test("la guardia detecta un uso real (control negativo)", () => {
    expect(PROHIBIDO.some((re) => re.test(sinComentarios('import { Inter } from "next/font/google";')))).toBe(true);
    expect(PROHIBIDO.some((re) => re.test(sinComentarios("/* fonts.googleapis.com */")))).toBe(false);
  });

  test("cada fuente referenciada existe en el repo y figura en lib/fonts/files/OFL.txt", () => {
    const refs = TODOS.flatMap((f) => {
      const src = fs.readFileSync(f, "utf8");
      return Array.from(src.matchAll(/["'(]([^"'()]*lib\/fonts\/files\/[^"'()]+\.woff2)["')]/g)).map((m) =>
        path.resolve(path.dirname(f), m[1]),
      );
    });
    expect(refs.length).toBeGreaterThanOrEqual(20);
    const licencia = fs.readFileSync(path.join(RAIZ, "lib/fonts/files/OFL.txt"), "utf8");
    expect(licencia).toMatch(/SIL OPEN FONT LICENSE Version 1\.1/);
    for (const r of refs) {
      expect(fs.existsSync(r)).toBe(true);
      // Cada familia servida figura en la licencia con su aviso de copyright.
      expect(licencia).toContain(`${path.basename(path.dirname(r))}/`);
    }
  });
});
