import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const RAIZ = join(__dirname, "..", "..");
const DIRS = ["components/analytics/kit", "lib/analytics"];

function archivos(dir: string): string[] {
  const abs = join(RAIZ, dir);
  return readdirSync(abs).flatMap((n) => {
    const p = join(abs, n);
    return statSync(p).isDirectory() ? archivos(join(dir, n)) : [join(dir, n)];
  });
}
const TODOS = DIRS.flatMap(archivos).filter((f) => /\.(ts|tsx)$/.test(f));

describe("aislamiento del kit", () => {
  it("hay archivos que revisar", () => expect(TODOS.length).toBeGreaterThan(5));
  it.each(TODOS)("%s no importa de tests/ ni de fixtures", (f) => {
    const src = readFileSync(join(RAIZ, f), "utf8");
    expect(src).not.toMatch(/from\s+["'][^"']*(tests\/|\.fixture|fixtures)/);
    expect(src).not.toMatch(/require\(\s*["'][^"']*(tests\/|fixtures)/);
  });
  it.each(TODOS)("%s no hardcodea colores (usa tokens --forge-*/clases forge)", (f) => {
    const src = readFileSync(join(RAIZ, f), "utf8");
    expect(src).not.toMatch(/#[0-9a-fA-F]{3,8}\b/);
    expect(src).not.toMatch(/\b(rgb|rgba|hsl|hsla)\(/);
  });
  it.each(TODOS)("%s no genera cifras al azar", (f) => {
    const src = readFileSync(join(RAIZ, f), "utf8");
    expect(src).not.toMatch(/Math\.random\(/);
  });
});
