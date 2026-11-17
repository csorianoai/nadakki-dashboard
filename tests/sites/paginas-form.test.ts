import { aForm, parche, sinIngles, textosBloque, validar } from "@/lib/sites/paginas/form";
import type { Page } from "@/lib/sites/types";

const page: Page = {
  id: "p1", tenant_id: "t", vertical: "realestate", site_id: "s", page_key: "inicio", status: "draft",
  slug: { es: "inicio", en: "home" }, title: { es: "SYNTH A", en: "SYNTH B" }, meta_description: { es: "SYNTH m" },
  body: [
    { block_id: "b1", type: "hero", i18n: { headline: { es: "SYNTH h", en: "SYNTH hh" } } },
    { block_id: "b2", type: "legal_broker", i18n: { texto: { es: "SYNTH legal" } } },
    { block_id: "b3", type: "gallery", data: { n: 1 } },
  ],
};

describe("paginas/form", () => {
  test("sin cambios: parche vacio y sin errores (positivo)", () => {
    const f = aForm(page);
    expect(parche(f, page)).toEqual({});
    expect(validar(f, page)).toEqual({});
  });
  test("solo se editan textos de bloques no legales", () => {
    expect(textosBloque(page).map((t) => t.id)).toEqual(["b1-headline"]);
  });
  test("ES vacio y slug invalido dan error (negativo)", () => {
    const f = aForm(page);
    f.title.es = " ";
    f.slug.es = "Mala Ruta";
    f.blocks["b1-headline"].es = "";
    expect(validar(f, page)).toEqual({ "titulo-es": "obligatorio", "slug-es": "patron", "b1-headline-es": "obligatorio" });
  });
  test("parche con un solo campo; EN vacio se omite; el body conserva bloques legales y desconocidos", () => {
    const f = aForm(page);
    f.title.en = "";
    expect(parche(f, page)).toEqual({ title: { es: "SYNTH A" } });
    const g = aForm(page);
    g.blocks["b1-headline"].es = "nuevo";
    const p = parche(g, page);
    expect(Object.keys(p)).toEqual(["body"]);
    expect(p.body![1]).toBe(page.body![1]);
    expect(p.body![2]).toBe(page.body![2]);
    expect(p.body![0].i18n).toEqual({ headline: { es: "nuevo", en: "SYNTH hh" } });
    expect(JSON.stringify(p)).not.toMatch(/tenant/);
  });
  test("cuenta textos sin ingles", () => {
    expect(sinIngles(aForm(page))).toBe(1);
  });
});
