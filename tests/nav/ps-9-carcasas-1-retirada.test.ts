/**
 * PS-9-CARCASAS-1 PARTE=3/3, criterio (d): la carcasa retirada (ForgeCreditHubAppShell) ya no existe y ningún
 * fichero de código la importa ni la reexporta (grep de importaciones = 0). ChAppShell NO se retira en esta tarjeta:
 * DealerChShell (dealer, fuera del alcance de PS-9-CARCASAS-1) la sigue importando.
 */
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(__dirname, "../..");
const CODIGO = ["app", "components", "lib", "hooks"];
const IMPORTA = /(?:import|export)[^;]*?from\s*["'][^"']*ForgeCreditHubAppShell["']|require\(\s*["'][^"']*ForgeCreditHubAppShell["']\s*\)|import\(\s*["'][^"']*ForgeCreditHubAppShell["']\s*\)|\bForgeCreditHubAppShell\b\s*[,}][^;]*from\s*["']@\/components\/forge["']/;

function ficheros(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" || e.name.startsWith(".") ? [] : ficheros(p);
    return /\.(tsx?|jsx?|mjs)$/.test(e.name) ? [p] : [];
  });
}

describe("(d) ForgeCreditHubAppShell retirada", () => {
  test("el fichero de la carcasa ya no existe", () => {
    expect(fs.existsSync(path.join(RAIZ, "components/forge/layout/ForgeCreditHubAppShell.tsx"))).toBe(false);
  });

  test("grep de importaciones y reexportaciones en el código = 0", () => {
    const con = CODIGO.flatMap((d) => ficheros(path.join(RAIZ, d)))
      .filter((f) => IMPORTA.test(fs.readFileSync(f, "utf8")))
      .map((f) => path.relative(RAIZ, f));
    expect(con).toEqual([]);
  });
});
