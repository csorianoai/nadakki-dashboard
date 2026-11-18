/**
 * Centinela D5-SIN-CIFRAS-FALSAS: ninguna pantalla de estas carpetas puede llevar cifras de presentacion
 * escritas en el codigo (value="935", '41.2K', '$125K', '94.5'...). Una pantalla nueva con cifras fijas se pone roja sola.
 */
import * as fs from "fs";
import * as path from "path";

const RAIZ = path.resolve(__dirname, "..");
const CARPETAS = ["email", "automations", "audiences", "social", "analytics", "ai-studio", "workflows"];

// Lista de excepciones: vacia a proposito. Si algo debe entrar, hay que justificarlo aqui con una razon por linea.
const EXCEPCIONES: string[] = [];

const PATRONES: Array<[string, RegExp]> = [
  ["value=\"<digitos>\"", /\bvalue=(?:"|\{\s*["'`])\$?[1-9]/],
  ["value: \"<digitos>\"", /\bvalue:\s*["'`]\$?[1-9]/],
  ["cadena tipo 41.2K / $125K", /["'`]\$?[1-9][\d.,]*\s?[KkMm]["'`]/],
  ["cadena tipo 12,450 / 94.5 / 3.2%", /["'`]\$?(?:[1-9]\d{0,2}(?:,\d{3})+|\d+\.\d+)%?["'`]/],
  ["porcentaje fijo (99%)", /^(?!.*(?:width|height|opacity|flex)).*["'`][1-9]\d*%["'`]/],
  ["94.5", /\b94\.5\b/],
];

function paginas(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" ? [] : paginas(p);
    return e.name === "page.tsx" ? [p] : [];
  });
}

describe("sin cifras fijas en pantallas", () => {
  const archivos = CARPETAS.flatMap((c) => paginas(path.join(RAIZ, c)));

  it("encuentra pantallas que revisar", () => {
    expect(archivos.length).toBeGreaterThan(0);
  });

  it("la lista de excepciones esta vacia", () => {
    expect(EXCEPCIONES).toEqual([]);
  });

  it.each(CARPETAS)("%s no contiene literales numericos de presentacion", (carpeta) => {
    const hallazgos: string[] = [];
    for (const f of archivos.filter((a) => a.startsWith(path.join(RAIZ, carpeta) + path.sep))) {
      const rel = path.relative(RAIZ, f);
      if (EXCEPCIONES.includes(rel)) continue;
      fs.readFileSync(f, "utf8").split("\n").forEach((linea, i) => {
        const l = linea.trim();
        if (l.startsWith("//") || l.startsWith("*") || l.startsWith("/*")) return;
        for (const [nombre, re] of PATRONES) if (re.test(l)) hallazgos.push(`${rel}:${i + 1} [${nombre}] ${l.slice(0, 100)}`);
      });
    }
    expect(hallazgos).toEqual([]);
  });
});
