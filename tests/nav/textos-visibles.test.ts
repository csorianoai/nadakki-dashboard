/**
 * PULIDO 7, pasada 1: textos visibles de menú, carcasa y migas de la Suite sin inglés ni tildes rotas.
 * La pasada 2 reutiliza `detectarEnRutas` con otras carpetas.
 */
import { detectarEnFuente, detectarEnRutas } from "./detector-textos";

const RUTAS_PASADA_1 = ["lib/navigation.ts", "lib/migas.ts", "components/shell", "components/forge/layout"];

describe("detector de textos visibles", () => {
  test("falla con mala codificación", () => {
    const h = detectarEnFuente('const a = { label: "AdministraciÃ³n" };');
    expect(h.map((x) => x.motivo)).toContain("mala codificación");
  });
  test("falla con «?» entre letras", () => {
    expect(detectarEnFuente('const a = "Ni?os";')).toHaveLength(1);
  });
  test("falla con inglés", () => {
    expect(detectarEnFuente('const a = "Loading...";').length).toBe(1);
    expect(detectarEnFuente("const a = <p>Sign out</p>;").length).toBe(1);
  });
  test("no cuenta keywords, comentarios, rutas ni marcas", () => {
    expect(detectarEnFuente('{ label: "Flujos", keywords: ["settings", "Settings"] }')).toEqual([]);
    expect(detectarEnFuente('// Loading\nconst a = "/settings?x=1"; const b = "Credit Hub";')).toEqual([]);
    expect(detectarEnFuente('const e = "Cockpit Error";').length).toBe(1);
    expect(detectarEnFuente(`x = l.startsWith("en") ? "Close" : "Cerrar";`)).toEqual([]);
  });
});

describe("Suite corregida", () => {
  test("menú, carcasa y migas sin hallazgos", () => {
    const h = detectarEnRutas(RUTAS_PASADA_1);
    expect(h.map((x) => `${x.archivo}:${x.linea} ${x.motivo} → ${x.texto}`)).toEqual([]);
  });
});
