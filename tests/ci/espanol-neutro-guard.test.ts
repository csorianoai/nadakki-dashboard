import fs from "fs";
import path from "path";

/**
 * Guard de español neutro (sin voseo) POR REGLA, no por lista de palabras (decisión de César, 18-oct: la lista fija
 * se quedó corta tres veces seguidas en este PR). Reglas sobre cada palabra del texto:
 *  1. Imperativo de vos: palabra aguda terminada en á/é/í (guardá, tené, escribí, copiá, seguí).
 *  2. Presente de vos: terminada en ás/és/ís (tenés, podés, decís, creés).
 *  3. Enclíticos de vos sin tilde (tildalo, dejala, escribila…): lista corta, porque una regla general choca con
 *     sustantivos (modelo, escuela, tabla).
 * Excepciones CERRADAS: futuros (será, guardará, podrás, tendrás…), agudas neutras (está, comité, después, país…) y
 * topónimos con aguda final (San Francisco de Macorís, Samaná, Cotuí…). SUELO: lo que la lista anterior prohibía y la
 * regla no distingue del futuro por la forma (mirá/esperá frente a dirá/esperará) sigue prohibido.
 * Medido sobre app/components/lib en f4f4b0b1: 0 avisos; detecta las 81 formas de la lista anterior.
 */
const NEUTRAS = new Set(
  (
    "está estás están allá ahí aquí allí así sí mí qué café bebé mamá papá sofá josé maní rubí " +
    "también jamás además demás atrás detrás quizás después través inglés francés portugués japonés holandés escocés " +
    "interés revés cortés país anís parís más dé sé té ojalá olé bidé puré canapé chalé carné pié vudú " +
    "alhelí bisturí colibrí esquí jabalí maniquí frenesí tabú hindú comité comités esté estés caché compré mié " +
    "macorís samaná jimaní yamasá duvergé baní boyá cotuí sabaná panamá bogotá canadá perú"
  ).split(/\s+/),
);
const FUTUROS = new Set(
  (
    "será hará dirá podrá tendrá habrá sabrá querrá vendrá saldrá pondrá valdrá cabrá estará irá verá dará leerá " +
    "caerá oirá reirá querrás harás dirás"
  ).split(/\s+/),
);
const SUELO = new Set("vos acá usá mirá esperá separá generá configurá cambiá copiá seguí creés".split(/\s+/));
const ENCLITICOS = new Set(
  (
    "tildalo tildala escribila escribilo buscalo buscala dejala dejalo completala completalo copiala copialo " +
    "entregala entregalo restablecela pedile pedila pedilo corregilos corregila intentalo subila subilo escribinos " +
    "avisanos contanos mandalo mandala probalo probala revisalo revisala guardalo guardala"
  ).split(/\s+/),
);
const PALABRA = /\p{L}+/gu;

export function esVoseo(palabra: string): boolean {
  const p = palabra.toLowerCase();
  if (SUELO.has(p) || ENCLITICOS.has(p)) return true;
  if (p.length < 3 || NEUTRAS.has(p) || FUTUROS.has(p)) return false;
  if (/[áéíóú].+[áéí]s?$/u.test(p)) return false; // dos tildes: no es una forma simple de vos
  if (/[db]rás?$/u.test(p)) return false; // futuros irregulares: podrá(s), tendrá(s), sabrá(s)
  if (/[áéí]$/u.test(p)) {
    if (p.length >= 6 && /[aei]rá$/u.test(p)) return false; // futuro regular: guardará, aparecerá
    if (/[aei]ré$/u.test(p)) return false; // futuro 1.ª persona: haré, guardaré
    return true;
  }
  if (/[áéí]s$/u.test(p)) {
    if (p.length >= 5 && /[aei]rás$/u.test(p)) return false; // futuro de tú: verás, serás, guardarás
    return true;
  }
  return false;
}

export function findVoseo(content: string): string[] {
  return content.split("\n").flatMap((line, i) => {
    // «\nEstás» dentro de un literal es «Estás», no «nEstás»
    const limpia = line.replace(/\\u[0-9a-fA-F]{4}/g, " ").replace(/\\[nrt]/g, " ");
    const hits = (limpia.match(PALABRA) || []).filter(esVoseo);
    return hits.length ? [`${i + 1}: [${hits.join(",")}] ${line.trim()}`] : [];
  });
}

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

// Las 81 formas que prohibía la lista anterior: la regla no puede perder ninguna.
const LISTA_ANTERIOR = (
  "tenés|podés|querés|sabés|necesitás|ingresá|seleccioná|revisá|completá|elegí|hacé|mirá|volvé|pedile|pedila|" +
  "escribinos|acá|filtrá|ordená|cargá|descargá|registrá|subí|subila|recargá|usá|reintentá|intentá|intentalo|avisá|" +
  "buscá|probá|reexportá|eliminá|cerrá|creés|corregilos|vos|guardá|arrastrá|borrá|indicá|escribí|evitá|separá|" +
  "empezá|verificá|documentá|dejá|definí|tené|poné|decí|mandá|abrí|esperá|seguí|entrá|activá|asigná|marcá|copiá|" +
  "generá|actualizá|agregá|ajustá|confirmá|cambiá|configurá|corregí|tildalo|escribila|escribilo|buscalo|aplicás|" +
  "listás|dejala|completala|copiala|entregala|restablecela"
).split("|");

describe("guard de español neutro (sin voseo), por regla", () => {
  test("el árbol app/components/lib no contiene formas voseantes", () => {
    const hits = DIRS.flatMap((d) => walk(path.join(ROOT, d), [])).flatMap((file) =>
      findVoseo(fs.readFileSync(file, "utf8")).map((h) => `${path.relative(ROOT, file)}:${h}`),
    );
    expect(hits).toEqual([]);
  });

  test("el fixture con voseo hace fallar el guard", () => {
    const fixture = fs.readFileSync(path.join(ROOT, "tests/fixtures/voseo/con-voseo.txt"), "utf8");
    expect(findVoseo(fixture).length).toBeGreaterThan(0);
  });

  test("la regla cubre todas las formas de la lista anterior", () => {
    expect(LISTA_ANTERIOR.length).toBe(81);
    expect(LISTA_ANTERIOR.filter((w) => !esVoseo(w))).toEqual([]);
  });

  test("la regla detecta formas que ninguna lista tenía", () => {
    const nuevas = ["contá", "llamá", "leé", "comé", "corré", "sentís", "pedís", "escribís", "vení", "salí", "mostrá",
      "elegís", "perdés", "hacés", "contestá", "respondé", "anunciá", "enviá", "pagá", "firmá"];
    expect(nuevas.filter((w) => !esVoseo(w))).toEqual([]);
  });

  test("texto neutro, futuros, agudas neutras y topónimos no disparan el guard", () => {
    for (const t of ["Tienes el permiso. Vuelve a iniciar sesión.", "El comité está revisando", "Santo Domingo, Samaná y Cotuí",
      "San Francisco de Macorís", "Más detalles después", "Podrás editarlo y se guardará", "Este país", "esté listo",
      "¿Estás seguro?", "verás el resultado", "serás redirigido", "se dejará", "Mié 12", "Selecciona una opción",
      "no sabrás qué", "tendrás acceso", "habrá cambios", "Hola.\\nEstás en tu panel"]) {
      expect(findVoseo(t)).toEqual([]);
    }
  });
});
