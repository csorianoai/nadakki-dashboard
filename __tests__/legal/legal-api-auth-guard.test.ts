/**
 * @jest-environment node
 *
 * Guarda anti-regresion de DASH-LEGAL (L1).
 *
 * Por que existe: el backend Legal exige JWT desde 2026-07-29 (mutaciones de
 * expedientes, #699) y 2026-09-06/07 (resto, LEGAL-AUTH-01/02, #1162-#1183), y
 * los clientes Legal del dashboard llamaban con `fetch` crudo y solo
 * `X-Tenant-ID`: 401 missing_auth en todo el panel. El 27-jun (#194) el mismo
 * fallo se arreglo solo en Audiencias. Causa raiz medida en T1:
 * https://github.com/csorianoai/nadakki-ai-suite/pull/1823#issuecomment-6109841329
 *
 * Regla: un fichero de Legal que hable con la API Legal (ruta literal
 * `/api/legal...` o `/api/v1/legal...`, o que importe un modulo cliente de
 * Legal) no puede usar `fetch` crudo ni `fetchAPI` de lib/api/base.ts: tiene
 * que pasar por `apiFetch`, que es quien pone `Authorization: Bearer`.
 */
import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..", "..");

// Rutas declaradas en DASH-LEGAL mas todo Legal.
const SCAN_ROOTS = ["app/(forge)/legal", "components", "lib"];
const IN_SCOPE = (rel: string) =>
  rel.startsWith("app/(forge)/legal/") ||
  /^components\/legal[^/]*\//.test(rel) ||
  /^lib\/legal[^/]*(\/|\.tsx?$)/.test(rel) ||
  rel === "lib/api/legal.ts";

// UNICA excepcion, y condicionada. lib/legal-cockpit/api.ts tiene un safeFetch
// con `fetch` crudo y sin token, pero hoy no es alcanzable: ningun fichero
// fuera de lib/legal-cockpit/ y components/legal-cockpit/ (sin contar
// __tests__/) importa legal-cockpit (medido en nadakki-dashboard 5c7acd85).
// Decision de Cesar (opcion B reforzada): se tolera mientras siga sin montarse;
// el segundo test de este fichero rompe en cuanto alguien lo importe.
// Candidato a borrado en un paquete aparte.
const EXCEPTIONS = new Set(["lib/legal-cockpit/api.ts"]);

const LEGAL_API_PATH = /["'`]\/api\/(?:v1\/)?legal(?:[/?"'`$]|$)/;
const LEGAL_CLIENT_IMPORT =
  /from\s+["']@\/lib\/(?:api\/legal|legal-api|legal\/cases\/legal-cases-api|legal\/library-api|legal-cockpit\/api)["']/;
const RAW_FETCH = /(?<![\w$])fetch\s*\(/;
// L2b: `fetch` como valor (variable, ternario: `x ? fetch : apiFetch`) tampoco vale.
// Se busca sin comentarios ni cadenas; se excluyen `.fetch`, llamadas `fetch(` y el
// metodo generico `fetch<T>(` de lib/api/legal.ts.
const FETCH_REF = /(?<![\w$.])fetch(?![\w$])(?!\s*[(<])/;
const BASE_FETCHAPI_IMPORT = /import\s*\{[^}]*\bfetchAPI\b[^}]*\}\s*from\s*["']@\/lib\/api\/base["']/;

function walk(dir: string, out: string[] = []): string[] {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) return out;
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const rel = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) walk(rel, out);
    else if (/\.(ts|tsx)$/.test(entry.name)) out.push(rel);
  }
  return out;
}

const stripComments = (src: string) =>
  src.replace(/\/\*[\s\S]*?\*\//g, "").replace(/(^|[^:"'`])\/\/.*$/gm, "$1");
const stripStrings = (src: string) =>
  src.replace(/`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/g, '""');

function legalFilesWithoutToken(): string[] {
  const files = Array.from(new Set(SCAN_ROOTS.flatMap((d) => walk(d)))).filter(IN_SCOPE);
  return files
    .filter((rel) => !EXCEPTIONS.has(rel))
    .filter((rel) => {
      const src = stripComments(fs.readFileSync(path.join(ROOT, rel), "utf8"));
      const talksToLegal = LEGAL_API_PATH.test(src) || LEGAL_CLIENT_IMPORT.test(src);
      const code = stripStrings(src);
      return talksToLegal && (RAW_FETCH.test(code) || FETCH_REF.test(code) || BASE_FETCHAPI_IMPORT.test(src));
    })
    .sort();
}

describe("DASH-LEGAL: los clientes Legal envian el JWT", () => {
  it("ningun fichero de Legal llama a la API Legal sin apiFetch", () => {
    const offenders = legalFilesWithoutToken();
    if (offenders.length > 0) {
      throw new Error(
        "Llaman a la API Legal sin apiFetch (fetch crudo, fetch guardado en una variable o fetchAPI de lib/api/base.ts, sin token):\n" +
          offenders.map((f) => `  - ${f}`).join("\n"),
      );
    }
  });

  it("legal-cockpit sigue sin ser alcanzable (condicion de su excepcion)", () => {
    const all = Array.from(
      new Set(["app", "components", "lib", "hooks", "contexts", "src", "pages"].flatMap((d) => walk(d))),
    );
    const importers = all
      .filter((rel) => !/^(lib|components)\/legal-cockpit\//.test(rel))
      .filter((rel) =>
        /(?:from\s+|import\s*\(\s*|require\s*\(\s*)["'][^"']*legal-cockpit[^"']*["']/.test(
          stripComments(fs.readFileSync(path.join(ROOT, rel), "utf8")),
        ),
      )
      .sort();
    if (importers.length > 0) {
      throw new Error(
        "legal-cockpit ya es alcanzable: su safeFetch envía sin token; corrígelo antes de montarlo\n" +
          importers.map((f) => `  - ${f}`).join("\n"),
      );
    }
  });
});
