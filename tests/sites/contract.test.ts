import schema from "@/lib/sites/contract/schema.json";
import * as types from "@/lib/sites/types";

const defs = (schema as { $defs: Record<string, { required?: string[]; properties?: Record<string, unknown> }> }).$defs;

describe("tipos escritos a mano vs contrato C-SITES-ADMIN-API", () => {
  it("la copia del contrato es la 1.0.0", () => {
    expect((schema as { "x-contract"?: unknown })["x-contract"]).toBeDefined();
  });

  it("cada tipo exportado declara sus propiedades requeridas", () => {
    const exported = types.TYPE_REQUIRED;
    const nombres = Object.keys(exported);
    for (const n of ["Site", "Page", "Listing", "Development", "Zone", "Building", "MediaAsset", "MediaCreate", "Violation", "Problem", "PublishResult", "ReadinessReport", "OverrideCreate", "ComplianceOverride", "I18nText"]) {
      expect(nombres).toContain(n);
    }
    for (const n of nombres) {
      expect(defs[n]).toBeDefined();
      expect([...exported[n]].sort()).toEqual([...(defs[n].required ?? [])].sort());
      for (const p of defs[n].required ?? []) {
        // propiedad requerida presente en el contrato (propiedades propias o heredadas de *Fields)
        const own = defs[n].properties ?? {};
        const alsoInFields = Object.values(defs).some((d) => d.properties && p in d.properties);
        expect(p in own || alsoInFields).toBe(true);
      }
    }
  });

  it("enums del contrato coinciden", () => {
    expect([...types.SEVERITIES]).toEqual((defs.Severity as unknown as { enum: string[] }).enum);
    expect([...types.SITE_STATUSES]).toEqual((defs.SiteStatus as unknown as { enum: string[] }).enum);
  });
});
