/**
 * Detector de textos visibles mal escritos (PULIDO 7, auditoría de Cowork 2026-10-15): secuencias de mala
 * codificación (tildes rotas) y literales en inglés de una lista cerrada. Se exporta para que la pasada 2
 * (resto de pantallas) lo reutilice con otras rutas.
 */
import fs from "fs";
import path from "path";

export type Hallazgo = { archivo: string; linea: number; texto: string; motivo: string };

/** Palabras en inglés que no deben verse en la interfaz. Lista cerrada y ampliable. */
export const PALABRAS_INGLES = [
  "Loading", "Error", "Save", "Cancel", "Submit", "Search", "Settings", "Dashboard", "Welcome", "Back", "Next",
  "Tenant", "Sign in", "Sign out", "Log in", "Log out", "Login", "Logout", "Users", "Roles", "Delete", "Edit",
  "Close", "Retry", "Home", "Profile", "Reports", "Overview", "Create", "Update", "Confirm", "Select",
] as const;

/** Marcas y nombres propios que contienen una palabra de la lista; cada uno con su justificación. */
export const EXCEPCIONES: Record<string, string> = {
  "Credit Hub": "marca del producto",
  "Dealer OS": "marca del producto",
  "Realtor OS": "marca del producto",
  Cockpit: "marca del producto",
  "Content Hub": "marca del producto",
};

const MALA_CODIFICACION = /[ÃÂ]|�/;
const SIGNO_ENTRE_LETRAS = /\p{L}\?\p{L}/u;

/** Sustituye comentarios por espacios (conserva los saltos de línea para numerar bien). */
function sinComentarios(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\/|(^|[^:"'`\\])\/\/[^\n]*/g, (m, p1) => {
    const pre = p1 ?? "";
    return pre + m.slice(pre.length).replace(/[^\n]/g, " ");
  });
}

function lineaDe(src: string, idx: number): number {
  return src.slice(0, idx).split("\n").length;
}

/** Literales de texto (comillas y plantillas simples) y texto JSX entre etiquetas. */
export function extraerTextos(src: string): { linea: number; texto: string }[] {
  const limpio = sinComentarios(src);
  const out: { linea: number; texto: string }[] = [];
  const lineas = limpio.split("\n");
  const esImport = (n: number) => /^\s*(import|export\s.*\sfrom)\b/.test(lineas[n - 1] ?? "");
  const esKeywords = (n: number) => /keywords\s*:/.test(lineas[n - 1] ?? "");
  // Rama de idioma inglés de un selector de locale: el inglés es intencional ahí.
  const esRamaIngles = (n: number) => /startsWith\(["']en["']\)/.test(lineas[n - 1] ?? "");
  const re = /"((?:[^"\\\n]|\\.)*)"|'((?:[^'\\\n]|\\.)*)'|`((?:[^`\\$]|\\.|\$(?!\{))*)`|>([^<>{}\n]+)</g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(limpio))) {
    const texto = m[1] ?? m[2] ?? m[3] ?? m[4] ?? "";
    const linea = lineaDe(limpio, m.index);
    if (!texto.trim() || esImport(linea) || esKeywords(linea) || esRamaIngles(linea)) continue;
    out.push({ linea, texto });
  }
  return out;
}

function esTextoVisible(t: string): boolean {
  if (/^\s*\//.test(t) || t.includes("://") || /[=&]/.test(t)) return false;
  return /\p{L}/u.test(t);
}

function quitarExcepciones(t: string): string {
  return Object.keys(EXCEPCIONES).reduce((acc, k) => acc.split(k).join(" "), t);
}

export function detectarEnFuente(src: string, archivo = "fixture"): Hallazgo[] {
  const hallazgos: Hallazgo[] = [];
  src.split("\n").forEach((l, i) => {
    if (MALA_CODIFICACION.test(l)) hallazgos.push({ archivo, linea: i + 1, texto: l.trim(), motivo: "mala codificación" });
  });
  for (const { linea, texto } of extraerTextos(src)) {
    if (!esTextoVisible(texto)) continue;
    if (!MALA_CODIFICACION.test(texto) && SIGNO_ENTRE_LETRAS.test(texto)) {
      hallazgos.push({ archivo, linea, texto, motivo: "«?» entre letras (ñ o tilde perdida)" });
    }
    const resto = quitarExcepciones(texto);
    for (const p of PALABRAS_INGLES) {
      if (new RegExp(`(^|[^\\p{L}])${p}($|[^\\p{L}])`, "u").test(resto)) {
        hallazgos.push({ archivo, linea, texto, motivo: `inglés: «${p}»` });
      }
    }
  }
  return hallazgos;
}

function listar(ruta: string): string[] {
  if (!fs.existsSync(ruta)) return [];
  if (fs.statSync(ruta).isFile()) return [ruta];
  return fs.readdirSync(ruta).flatMap((n) => listar(path.join(ruta, n)));
}

/** Recorre archivos o carpetas (relativos a `raiz`) y devuelve los hallazgos de .ts/.tsx. */
export function detectarEnRutas(rutas: string[], raiz = process.cwd()): Hallazgo[] {
  return rutas
    .flatMap((r) => listar(path.join(raiz, r)))
    .filter((f) => /\.tsx?$/.test(f))
    .flatMap((f) => detectarEnFuente(fs.readFileSync(f, "utf8"), path.relative(raiz, f)));
}
