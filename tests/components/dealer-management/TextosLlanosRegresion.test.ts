/**
 * Regresión UX-TEXTOS: el usuario del dealer no debe ver jerga técnica.
 * Recorre los fuentes .tsx del dealer y falla si reaparece texto técnico visible.
 * El detalle técnico va en `DetalleTecnico` (plegado) o en un tooltip, nunca como texto suelto.
 */
import fs from "fs";
import path from "path";

const RAIZ = path.resolve(__dirname, "../../..");
const CARPETAS = ["app/autos/dealer", "components/dealer", "components/dealer-management", "components/contable"];

// Frases que ya se corrigieron y no pueden volver.
const PROHIBIDAS: Array<{ nombre: string; patron: RegExp }> = [
  { nombre: "Accesos reales del tenant", patron: /Accesos reales del tenant/ },
  { nombre: "El frontend restringe", patron: /El frontend restringe|nunca concede permisos/ },
  { nombre: "sin reason_code", patron: /sin reason_code/ },
  { nombre: "El backend respondió HTTP", patron: /El backend respondi[óo] HTTP/ },
  { nombre: "reason_code: como etiqueta visible", patron: />[^<>{}]*\breason_code:\s*(<code>|\{)/ },
  { nombre: "reason_code: en texto de JSX", patron: /^\s*[A-Za-zÁ-ú][^`'"=<>{}]*\.\s*reason_code:\s*<code>/ },
];

const esPendiente = (_f: string) => false;
const esComentario = (l: string) => /^\s*(\/\/|\/\*|\*)/.test(l);

function archivos(dir: string): string[] {
  const abs = path.join(RAIZ, dir);
  if (!fs.existsSync(abs)) return [];
  return fs.readdirSync(abs, { withFileTypes: true }).flatMap((e) => {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) return e.name === "tests" || e.name === "__tests__" ? [] : archivos(rel);
    return /\.tsx$/.test(e.name) && !/\.test\.tsx$/.test(e.name) ? [rel] : [];
  });
}

describe("textos llanos del dealer (regresión UX-TEXTOS)", () => {
  const todos = CARPETAS.flatMap(archivos);

  it("encuentra fuentes para revisar", () => {
    expect(todos.length).toBeGreaterThan(20);
  });

  it.each(PROHIBIDAS)("no reaparece: $nombre", ({ patron }) => {
    const hallazgos = todos
      .filter((f) => !esPendiente(f))
      .filter((f) => fs.readFileSync(path.join(RAIZ, f), "utf8").split("\n").some((l) => !esComentario(l) && patron.test(l)));
    expect(hallazgos).toEqual([]);
  });

  it("el código para soporte solo aparece dentro de DetalleTecnico", () => {
    const sueltos = todos.filter((f) => !esPendiente(f)).filter((f) => {
      const txt = fs.readFileSync(path.join(RAIZ, f), "utf8");
      const re = /Código para soporte/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(txt))) {
        const antes = txt.slice(0, m.index);
        const abre = Math.max(antes.lastIndexOf("<DetalleTecnico"), antes.lastIndexOf("<details"));
        const cierra = Math.max(antes.lastIndexOf("</DetalleTecnico>"), antes.lastIndexOf("</details>"));
        if (abre < 0 || cierra > abre) return true;
      }
      return false;
    });
    expect(sueltos).toEqual([]);
  });
});
