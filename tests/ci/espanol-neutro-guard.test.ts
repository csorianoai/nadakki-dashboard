import fs from "fs";
import path from "path";

/** Formas voseantes prohibidas en texto visible: un solo español neutro para todos los tenants. */
const FORMAS = "tenés|podés|querés|sabés|necesitás|ingresá|seleccioná|revisá|completá|elegí|hacé|mirá|volvé|pedile|pedila|escribinos|acá|filtrá|ordená|cargá|descargá|registrá|subí|subila|recargá|usá|reintentá|intentá|intentalo|avisá|buscá|probá|reexportá|eliminá|cerrá|creés|corregilos|vos|guardá|arrastrá|borrá|indicá|escribí|evitá|separá|empezá|verificá|documentá|dejá|definí|tené|poné|decí|mandá|abrí|esperá|seguí|entrá|activá|asigná|marcá|copiá|generá|actualizá|agregá|ajustá|confirmá|cambiá|configurá|corregí|cargá";
// \b de JS no reconoce vocales acentuadas como palabra: se usan límites Unicode.
export const VOSEO_RE = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${FORMAS})(?![\\p{L}\\p{N}_])`, "iu");

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

  test("detecta imperativos agudos con vocal acentuada final", () => {
    for (const t of ["Revisá la tabla", "Elegí uno", "Acá ves", "Volvé a entrar", "Completá el dato", "Filtrá por estado", "Guardá los cambios", "Indicá la fecha", "Escribí el precio", "Evitá usar", "Definí una de"]) {
      expect(findVoseo(t).length).toBeGreaterThan(0);
    }
  });

  test("texto neutro no dispara el guard", () => {
    expect(findVoseo("Tienes el permiso. Vuelve a iniciar sesión.")).toEqual([]);
  });
});
