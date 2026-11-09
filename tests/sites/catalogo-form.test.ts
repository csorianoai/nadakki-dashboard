jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
import { apiFetch } from "@/lib/api/fetch-client";
import schema from "@/lib/sites/contract/schema.json";
import * as c from "@/lib/sites/client";
import { SitesApiError } from "@/lib/sites/errors";
import { SPEC, aForm, cuerpo, getPath, parche, sinIngles, validar, vacio, verificado, type Ent } from "@/lib/sites/catalogo/form";
import { demoItems, resetDemoCatalogo, saveDemoItem } from "@/lib/sites/catalogo/mock";
import { CAT, ERR } from "@/lib/sites/catalogo/copy";
import { resp, SITE_A } from "./fake";

const f = apiFetch as jest.Mock;
const problem = (status: number, code: string) => resp({ type: "x", title: "t", status, code }, status, "application/problem+json");
const defs = (schema as unknown as { $defs: Record<string, { properties: Record<string, unknown> }> }).$defs;
const CAMPOS: Record<Ent, string> = { desarrollos: "DevelopmentFields", zonas: "ZoneFields", edificios: "BuildingFields" };
const llenar = (e: Ent, v: Record<string, string>) => ({ ...vacio(e), ...v });

beforeEach(() => { f.mockReset(); resetDemoCatalogo(); });

describe("catalogo: campos del contrato", () => {
  test.each(Object.keys(CAMPOS) as Ent[])("%s: cada campo es del contrato y ninguno es de staff ni tenant", (e) => {
    const props = Object.keys(defs[CAMPOS[e]].properties);
    for (const s of SPEC[e]) {
      expect(props).toContain(s.path.split(".")[0]);
      expect(s.path).not.toMatch(/tenant|authoriz|legal/i);
    }
    expect(JSON.stringify(cuerpo(e, llenar(e, Object.fromEntries(SPEC[e].map((s) => [s.id, "x"])))))).not.toMatch(/tenant|authoriz/i);
  });
  test("todo texto tiene es y en", () => {
    for (const b of [...Object.values(CAT), ...Object.values(ERR)]) { expect(b.es.trim()).not.toBe(""); expect(b.en.trim()).not.toBe(""); }
    for (const e of Object.keys(CAMPOS) as Ent[]) for (const s of SPEC[e]) expect(CAT[`l_${s.id}`]).toBeDefined();
  });
});

describe("catalogo: validacion", () => {
  test("zona con dato de mercado sin fuente ni fecha no es enviable (negativo)", () => {
    const e = validar("zonas", llenar("zonas", { slug: "norte", "nombre-es": "Norte", "precio-min": "100000", moneda: "USD" }));
    expect(e).toEqual({ fuente: "required", "fecha-fuente": "required" });
  });
  test("zona con dato de mercado y fuente/fecha, o sin dato de mercado, es enviable (positivo)", () => {
    const ok = { slug: "norte", "nombre-es": "Norte" };
    expect(validar("zonas", llenar("zonas", { ...ok, "precio-max": "9", moneda: "USD", fuente: "Informe", "fecha-fuente": "2026-03-01" }))).toEqual({});
    expect(validar("zonas", llenar("zonas", ok))).toEqual({});
  });
  test("precio sin moneda, fecha inexistente y slug mal formado", () => {
    const e = validar("zonas", llenar("zonas", { slug: "Mal Slug", "nombre-es": "N", "precio-min": "1", fuente: "x", "fecha-fuente": "2026-02-30" }));
    expect(e).toEqual({ slug: "pattern", moneda: "required", "fecha-fuente": "date" });
  });
  test("edificio con HOA o estructura exige fuente y fecha del dato", () => {
    const base = { slug: "torre", nombre: "Torre" };
    expect(Object.keys(validar("edificios", llenar("edificios", { ...base, cuota: "120 al mes" }))).sort()).toEqual(["fecha-fuente", "fuente"]);
    expect(Object.keys(validar("edificios", llenar("edificios", { ...base, estructura: "Inspeccion 2025" }))).sort()).toEqual(["fecha-fuente", "fuente"]);
    expect(validar("edificios", llenar("edificios", { ...base, cuota: "120", fuente: "Junta", "fecha-fuente": "2026-01-15" }))).toEqual({});
    expect(validar("edificios", llenar("edificios", base))).toEqual({});
  });
  test("desarrollo: nombre obligatorio, anio, moneda y pais con formato", () => {
    const e = validar("desarrollos", llenar("desarrollos", { slug: "d", anio: "1800", moneda: "usd", pais: "DOM", "precio-desde": "1,5" }));
    expect(e).toEqual({ nombre: "required", anio: "pattern", moneda: "pattern", pais: "pattern", "precio-desde": "pattern" });
  });
});

describe("catalogo: cuerpo, parche y lectura", () => {
  test("cuerpo omite vacios, no inventa 'en' y arma price_range del contrato", () => {
    const b = cuerpo("zonas", llenar("zonas", { slug: "centro", "nombre-es": "Centro", "precio-min": "100", "precio-max": "200", moneda: "USD", fuente: "I", "fecha-fuente": "2026-03-01" }));
    expect(b).toEqual({ slug: "centro", name: { es: "Centro" }, price_range: { min: { amount: "100", currency: "USD" }, max: { amount: "200", currency: "USD" } }, source: "I", source_date: "2026-03-01" });
    expect(cuerpo("desarrollos", llenar("desarrollos", { slug: "d", nombre: "D", anio: "2028", ciudad: "Santo Domingo" }))).toEqual({ slug: "d", name: "D", delivery_year: 2028, address: { city: "Santo Domingo" } });
  });
  test("parche envia solo lo cambiado y aForm lee lo guardado", () => {
    const item = { id: "1", slug: "centro", name: { es: "Centro", en: "Downtown" }, price_range: { min: { amount: "100", currency: "USD" } } };
    const base = aForm("zonas", item);
    expect(base).toMatchObject({ slug: "centro", "nombre-es": "Centro", "nombre-en": "Downtown", "precio-min": "100", moneda: "USD" });
    expect(parche("zonas", base, base)).toEqual({});
    expect(parche("zonas", { ...base, slug: "centro-2" }, base)).toEqual({ slug: "centro-2" });
    expect(getPath(item, "price_range.min.amount")).toBe("100");
  });
  test("aviso de ingles y estado de verificacion de solo lectura", () => {
    expect(sinIngles("zonas", llenar("zonas", { "nombre-es": "A", "intro-es": "B", "intro-en": "C" }))).toBe(1);
    expect([verificado({ authorized: true }), verificado({ authorized: false }), verificado({}), verificado(null)]).toEqual(["si", "pendiente", "no", "no"]);
  });
  test("almacen demo en memoria, sin datos sembrados", () => {
    expect(demoItems("zonas")).toEqual([]);
    saveDemoItem("zonas", { id: "1", slug: "a" });
    saveDemoItem("zonas", { id: "1", slug: "b" });
    expect(demoItems("zonas")).toEqual([{ id: "1", slug: "b" }]);
    expect(demoItems("edificios")).toEqual([]);
  });
});

describe("cliente: lectura de un elemento", () => {
  test.each([["getDevelopment", "developments"], ["getZone", "zones"], ["getBuilding", "buildings"]] as const)("%s pide la ruta same-origin sin tenant (positivo)", async (fn, ruta) => {
    f.mockResolvedValue(resp({ id: "x1", slug: "a" }));
    const r = await (c[fn] as (s: string, i: string) => Promise<{ slug: string }>)(SITE_A, "x1");
    expect(r.slug).toBe("a");
    expect(f.mock.calls[0][0]).toBe(`/api/v1/sites/sites/${SITE_A}/${ruta}/x1`);
    expect(JSON.stringify(f.mock.calls)).not.toMatch(/tenant|staff/i);
  });
  test("tenant ajeno: 404 NOT_FOUND y 403 TENANT_MISMATCH son error, nunca dato (negativo)", async () => {
    for (const [s, code] of [[404, "NOT_FOUND"], [403, "TENANT_MISMATCH"]] as const) {
      f.mockResolvedValue(problem(s, code));
      const e = await c.getDevelopment(SITE_A, "x1").catch((x) => x);
      expect(e).toBeInstanceOf(SitesApiError);
      expect([e.status, e.code]).toEqual([s, code]);
    }
  });
});
