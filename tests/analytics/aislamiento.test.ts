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
  it.each(TODOS)("%s no usa clases de color fijas de Forge (solo tokens semanticos del kit: --kit-*)", (f) => {
    const src = readFileSync(join(RAIZ, f), "utf8");
    expect(src).not.toMatch(/forge(Gray|Brand|Viz|Surface|Success|Warning|Danger|Info|Neutral)-/);
    expect(src).not.toMatch(/\b(?:text|bg|border|ring|fill|stroke|outline|divide|from|to|via)-(?:white|black|gray|slate|zinc|red|green|blue|amber|yellow)(?:-\d+)?\b/);
  });
  it.each(TODOS.filter((f) => f !== "lib/analytics/formato.ts"))("%s no fija locale ni moneda (todo sale del formato del tenant)", (f) => {
    const src = readFileSync(join(RAIZ, f), "utf8");
    expect(src).not.toMatch(/["'`](?:es|en|pt|fr)(?:[-_][A-Za-z]{2,4})?["'`]/); // "es", "es-ES", "en-US" como literal
    expect(src).not.toMatch(/\btoLocale(?:String|DateString|TimeString|UpperCase|LowerCase)?\(/);
    expect(src).not.toMatch(/\bIntl\./);
    expect(src).not.toMatch(/["'`](?:USD|ARS|EUR|MXN|DOP)["'`]/);
  });
  it("solo lib/analytics/formato.ts conoce el defecto es-US / USD", () => {
    const src = readFileSync(join(RAIZ, "lib/analytics/formato.ts"), "utf8");
    expect(src).toMatch(/locale: "es-US", moneda: "USD"/);
  });
  it.each(TODOS.filter((f) => f.endsWith(".tsx") && f.startsWith("components/") && !f.endsWith("FormatoProvider.tsx")))("%s importa la hoja de tokens del kit (los componentes que pintan)", (f) => {
    const src = readFileSync(join(RAIZ, f), "utf8");
    expect(src).toMatch(/import\s+"(?:\.\.?\/)+tema\.css";/);
  });
  it.each(TODOS)("%s no genera cifras al azar", (f) => {
    const src = readFileSync(join(RAIZ, f), "utf8");
    expect(src).not.toMatch(/Math\.random\(/);
  });
});
