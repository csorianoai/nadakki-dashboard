import * as fs from "fs";
import * as path from "path";
import { panelEncendido, demoPermitido } from "@/lib/sites/mode";
import { pick } from "@/lib/sites/copy-util";

describe("mode: interruptores fail-closed", () => {
  it.each([[undefined], ["0"], ["true"], [""], ["11"]])("panelEncendido y demoPermitido son false con %p", (v) => {
    expect(panelEncendido({ NEXT_PUBLIC_SITES_PANEL: v })).toBe(false);
    expect(demoPermitido({ NEXT_PUBLIC_SITES_ALLOW_DEMO: v })).toBe(false);
  });
  it("true solo con '1' exacto", () => {
    expect(panelEncendido({ NEXT_PUBLIC_SITES_PANEL: "1" })).toBe(true);
    expect(demoPermitido({ NEXT_PUBLIC_SITES_ALLOW_DEMO: "1" })).toBe(true);
  });
  it("cada interruptor lee solo su variable", () => {
    expect(panelEncendido({ NEXT_PUBLIC_SITES_ALLOW_DEMO: "1" })).toBe(false);
    expect(demoPermitido({ NEXT_PUBLIC_SITES_PANEL: "1" })).toBe(false);
  });
  it("sin argumentos lee process.env (literal) y es false por defecto", () => {
    expect(panelEncendido()).toBe(false);
    expect(demoPermitido()).toBe(false);
  });
});

describe("copy-util: pick", () => {
  it("elige en y respalda a es si falta o esta vacio", () => {
    expect(pick({ es: "hola", en: "hi" }, "en")).toBe("hi");
    expect(pick({ es: "hola" }, "en")).toBe("hola");
    expect(pick({ es: "hola", en: " " }, "en")).toBe("hola");
    expect(pick({ es: "hola", en: "hi" }, "es")).toBe("hola");
  });
});

describe("contrato: copia de C-SITES-ADMIN-API", () => {
  const schema = JSON.parse(fs.readFileSync(path.join(__dirname, "../../lib/sites/contract/schema.json"), "utf8"));
  it("es la version 1.0.0 y trae los tipos que usan las pantallas", () => {
    expect(schema.$id).toContain("C-SITES-ADMIN-API/1.0.0");
    for (const t of ["Site", "Page", "Listing", "Development", "Zone", "Building", "MediaAsset", "Violation", "Problem", "PublishResult", "ReadinessReport", "OverrideCreate", "ComplianceOverride", "I18nText"]) {
      expect(schema.$defs[t]).toBeDefined();
    }
  });
  it("Violation tiene las cuatro claves y Severity block|warn|info", () => {
    expect([...schema.$defs.Violation.required].sort()).toEqual(["field", "message", "rule_id", "severity"]);
    expect(schema.$defs.Severity.enum).toEqual(["block", "warn", "info"]);
  });
  it("tenant_id es de solo lectura (nunca lo envia el cliente)", () => {
    expect(schema.$defs.Site.properties.tenant_id.readOnly).toBe(true);
    expect(schema.$defs.SiteCreate.unevaluatedProperties).toBe(false);
  });
});
