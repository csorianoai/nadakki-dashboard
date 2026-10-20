/**
 * PS-9-CARCASAS-2 PARTE=7/7, criterio (d): la carcasa retirada (DccShell, con su menú DccShellSidebar y su barra
 * DccShellTopbar) ya no existe y ningún fichero de código ni de test la importa, la simula ni la reexporta (grep = 0).
 * El banco v2 la sustituyó por ModuleShell (PARTE 4) y sus tipos de menú viven en app/(forge)/credit-hub/bank-v2/_nav.ts.
 */
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(__dirname, "../..");
const CODIGO = ["app", "components", "lib", "hooks", "tests", "e2e"];
const RETIRADAS = ["DccShell", "DccShellSidebar", "DccShellTopbar"];
const ruta = (n: string) => `["'][^"']*dcc/shell/${n}["']`;
const IMPORTA = new RegExp(
  RETIRADAS.flatMap((n) => [
    `(?:import|export)[^;]*?from\\s*${ruta(n)}`,
    `require\\(\\s*${ruta(n)}\\s*\\)`,
    `import\\(\\s*${ruta(n)}\\s*\\)`,
    `jest\\.mock\\(\\s*${ruta(n)}`,
    `from\\s*["']\\./${n}["']`,
  ]).join("|"),
);

function ficheros(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" || e.name.startsWith(".") ? [] : ficheros(p);
    return /\.(tsx?|jsx?|mjs)$/.test(e.name) ? [p] : [];
  });
}

describe("(d) DccShell retirada", () => {
  test.each(RETIRADAS)("components/dcc/shell/%s.tsx ya no existe", (n) => {
    expect(fs.existsSync(path.join(RAIZ, `components/dcc/shell/${n}.tsx`))).toBe(false);
  });

  test("grep de importaciones, simulaciones y reexportaciones = 0", () => {
    const con = CODIGO.flatMap((d) => ficheros(path.join(RAIZ, d)))
      .filter((f) => IMPORTA.test(fs.readFileSync(f, "utf8")))
      .map((f) => path.relative(RAIZ, f));
    expect(con).toEqual([]);
  });
});
