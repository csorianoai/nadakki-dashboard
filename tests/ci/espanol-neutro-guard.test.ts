import fs from "fs";
import path from "path";

/** Formas voseantes prohibidas en texto visible: un solo español neutro para todos los tenants. */
export const VOSEO_RE = /\b(tenés|podés|querés|sabés|necesitás|ingresá|seleccioná|revisá|completá|elegí|hacé|mirá|volvé|pedile|escribinos|acá)\b/i;

const ROOT = path.resolve(__dirname, "../..");
const DIRS = ["app", "components", "lib"];
const SKIP_DIR = new Set(["node_modules", ".next", "tests", "__tests__", "__mocks__"]);
const SKIP_FILE = /\.(test|spec)\.[jt]sx?$/;

function walk(dir: string, out: string[]): string[] {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIR.has(entry.name)) walk(full, out);
    } else if (/\.tsx?$/.test(entry.name) && !SKIP_FILE.test(entry.name)) {
      out.push(full);
    }
  }
  return out;
}

export function findVoseo(content: string): string[] {
  return content.split("\n").flatMap((line, i) => (VOSEO_RE.test(line) ? [`${i + 1}: ${line.trim()}`] : []));
}

describe("guard de español neutro (sin voseo)", () => {
  test("el árbol app/components/lib no contiene formas voseantes", () => {
    const hits = DIRS.flatMap((d) => walk(path.join(ROOT, d), [])).flatMap((file) =>
      findVoseo(fs.readFileSync(file, "utf8")).map((h) => `${path.relative(ROOT, file)}:${h}`),
    );
    expect(hits).toEqual([]);
  });

  test("el fixture con 'tenés' hace fallar el guard", () => {
    const fixture = fs.readFileSync(path.join(ROOT, "tests/fixtures/voseo/con-voseo.txt"), "utf8");
    expect(findVoseo(fixture).length).toBeGreaterThan(0);
  });

  test("texto neutro no dispara el guard", () => {
    expect(findVoseo("Tienes el permiso. Vuelve a iniciar sesión.")).toEqual([]);
  });
});
