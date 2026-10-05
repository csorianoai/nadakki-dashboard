/**
 * Guardia: la app no debe depender de Google Fonts ni en build (next/font/google
 * descarga de fonts.gstatic.com en `next build` y rompe el build de CI) ni en
 * runtime (<link> / @import a fonts.googleapis.com).
 */
import fs from "fs";
import path from "path";
import { systemFont } from "@/lib/fonts/system-fonts";

const ROOT = path.resolve(__dirname, "../../..");
const SCAN_DIRS = ["app", "components", "styles", "lib"];
const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs", ".css", ".scss", ".html"]);
const SKIP_DIRS = new Set(["node_modules", ".next", "tests", "__tests__", "_inventory"]);
const FORBIDDEN = [/next\/font\/google/, /fonts\.googleapis\.com/, /fonts\.gstatic\.com/];

function sourceFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return SKIP_DIRS.has(entry.name) ? [] : sourceFiles(full);
    return EXTENSIONS.has(path.extname(entry.name)) ? [full] : [];
  });
}

function stripComments(code: string): string {
  return code.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'])\/\/.*$/gm, "$1");
}

describe("fuentes sin Google Fonts", () => {
  const files = SCAN_DIRS.flatMap((d) => sourceFiles(path.join(ROOT, d)));

  test("escanea el codigo fuente de la app", () => {
    expect(files.length).toBeGreaterThan(100);
  });

  test("ningun archivo importa next/font/google ni enlaza fonts.googleapis/gstatic", () => {
    const offenders = files.flatMap((file) => {
      const code = stripComments(fs.readFileSync(file, "utf8"));
      return FORBIDDEN.filter((re) => re.test(code)).map(
        (re) => `${path.relative(ROOT, file)} -> ${re.source}`,
      );
    });
    expect(offenders).toEqual([]);
  });

  test("cada variable de systemFont() esta definida en :root de app/globals.css", () => {
    const css = fs.readFileSync(path.join(ROOT, "app/globals.css"), "utf8");
    const used = new Set<string>();
    for (const file of files) {
      const code = fs.readFileSync(file, "utf8");
      for (const m of code.matchAll(/systemFont\("(--[a-z0-9-]+)"\)/g)) used.add(m[1]);
    }
    expect(used.size).toBeGreaterThanOrEqual(15);
    const missing = [...used].filter((v) => !new RegExp(`^\\s*${v}\\s*:`, "m").test(css));
    expect(missing).toEqual([]);
  });

  test("systemFont conserva la forma { variable, className } de next/font", () => {
    expect(systemFont("--font-sora")).toEqual({ variable: "--font-sora", className: "" });
  });
});
