/**
 * MF3-T3 — playwright.config.ts: en CI y sin URL externa levanta el servidor LOCAL con backend inexistente,
 * para que la evidencia (p. ej. e2e/mapaal-f3/t3-contraste.spec.ts) sea hermetica.
 */
import * as fs from "fs";
import * as path from "path";

const CFG = fs.readFileSync(path.join(process.cwd(), "playwright.config.ts"), "utf8");

describe("playwright.config hermetico en CI", () => {
  it("arranca webServer local cuando hay CI y no hay URL externa", () => {
    expect(CFG).toContain("webServer");
    expect(CFG).toContain("LOCAL_CI");
  });
  it("declara un backend que no resuelve y no apunta a nadakki.com", () => {
    expect(CFG).toContain("backend.invalid");
    expect(CFG).not.toMatch(/nadakki\.com/);
  });
});
