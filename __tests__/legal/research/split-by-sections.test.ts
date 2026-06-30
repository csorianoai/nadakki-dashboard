import {
  parseConclusionChips,
  splitBySections,
  stripConclusionStructuredPrefix,
} from "@/lib/legal/research/split-by-sections";

describe("splitBySections", () => {
  it("splits canonical markdown headers in order", () => {
    const md = `## Conclusión
El trabajador tiene derecho a 174 días.

## Hechos y supuestos
- 8 años de antigüedad

## Análisis normativo
Art. 80 aplica.

## Recomendación
1. Verificar nómina

## Límites y advertencias
- Solo para estos hechos`;

    const s = splitBySections(md);
    expect(s.hasCanonicalHeaders).toBe(true);
    expect(s.conclusion).toContain("174 días");
    expect(s.hechos).toContain("8 años");
    expect(s.analisis).toContain("Art. 80");
    expect(s.recomendacion).toContain("Verificar");
    expect(s.limites).toContain("Solo para estos hechos");
  });

  it("is accent and case tolerant", () => {
    const md = `## CONCLUSION
Texto.

## Analisis normativo
Detalle.`;
    const s = splitBySections(md);
    expect(s.conclusion).toBe("Texto.");
    expect(s.analisis).toBe("Detalle.");
  });

  it("falls back when no canonical headers", () => {
    const md = "Respuesta libre sin secciones.";
    const s = splitBySections(md);
    expect(s.hasCanonicalHeaders).toBe(false);
    expect(s.fallbackDocument).toBe(md);
  });

  it("omits missing sections without placeholders", () => {
    const md = `## Conclusión
Solo conclusión.`;
    const s = splitBySections(md);
    expect(s.conclusion).toBe("Solo conclusión.");
    expect(s.hechos).toBeUndefined();
    expect(s.analisis).toBeUndefined();
  });
});

describe("parseConclusionChips", () => {
  it("parses markdown table at section start", () => {
    const md = `| concepto | valor |
| --- | --- |
| preaviso | 28 días |
| cesantía | 174 días |

El trabajador…`;
    const chips = parseConclusionChips(md);
    expect(chips).toEqual([
      { label: "preaviso", value: "28 días" },
      { label: "cesantía", value: "174 días" },
    ]);
    expect(stripConclusionStructuredPrefix(md)).toContain("El trabajador");
  });

  it("parses key-value lines at section start", () => {
    const md = `preaviso: 28 días
cesantía: 174 días

Frase BLUF.`;
    const chips = parseConclusionChips(md);
    expect(chips?.length).toBe(2);
  });

  it("returns null for prose-only conclusion", () => {
    expect(parseConclusionChips("El trabajador tiene 174 días de auxilio.")).toBeNull();
  });
});
