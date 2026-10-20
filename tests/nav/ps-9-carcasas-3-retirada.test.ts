/**
 * PS-9-CARCASAS-3 PARTE=3/3, criterio (d): las carcasas retiradas (ForgeAppShell y GlobalForgeAppShell) ya no existen y
 * ningún fichero de código ni de test las importa, las simula ni las reexporta (grep = 0). Las sustituye ModuleShell.
 */
import fs from "node:fs";
import path from "node:path";

const RAIZ = path.resolve(__dirname, "../..");
const CODIGO = ["app", "components", "lib", "hooks", "tests", "e2e"];
const RETIRADAS = ["ForgeAppShell", "GlobalForgeAppShell"];
const ruta = (n: string) => `["'][^"']*forge/layout/${n}["']`;
const IMPORTA = new RegExp(
  RETIRADAS.flatMap((n) => [
    `(?:import|export)[^;]*?from\\s*${ruta(n)}`,
    `require\\(\\s*${ruta(n)}\\s*\\)`,
    `import\\(\\s*${ruta(n)}`,
    `jest\\.mock\\(\\s*${ruta(n)}`,
    `from\\s*["']\\./${n}["']`,
  ]).join("|"),
);
const ESTE = path.relative(RAIZ, __filename);

function ficheros(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "node_modules" || e.name.startsWith(".") ? [] : ficheros(p);
    return /\.(tsx?|jsx?|mjs)$/.test(e.name) ? [p] : [];
  });
}

describe("(d) ForgeAppShell y GlobalForgeAppShell retiradas", () => {
  test.each(RETIRADAS)("components/forge/layout/%s.tsx ya no existe", (n) => {
    expect(fs.existsSync(path.join(RAIZ, `components/forge/layout/${n}.tsx`))).toBe(false);
  });

  test("grep de importaciones, simulaciones y reexportaciones = 0", () => {
    const con = CODIGO.flatMap((d) => ficheros(path.join(RAIZ, d)))
      .map((f) => path.relative(RAIZ, f))
      .filter((f) => f !== ESTE && IMPORTA.test(fs.readFileSync(path.join(RAIZ, f), "utf8")));
    expect(con).toEqual([]);
  });
});
