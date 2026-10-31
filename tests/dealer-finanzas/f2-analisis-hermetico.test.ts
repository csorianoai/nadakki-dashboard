/**
 * F2 (regresion) — la evidencia e2e/mapaal-f3/f2-analisis.spec.ts volvio a dar FAIL cuando se evaluo sin servidor local
 * (sin webServer ni BASE_URL, `goto` iba a 127.0.0.1:3000 o a api.nadakki.com). Este test fija las dos condiciones que la
 * mantienen hermetica: el config levanta el servidor local en CI con backend inexistente, y el spec no usa URLs absolutas.
 * @jest-environment node
 */
import { readFileSync } from "fs";
import { join } from "path";

const leer = (p: string) => readFileSync(join(process.cwd(), p), "utf8");
const spec = leer("e2e/mapaal-f3/f2-analisis.spec.ts");
const cfg = leer("playwright.config.ts");

describe("F2: evidencia hermetica", () => {
  it("playwright.config levanta el servidor local en CI con backend que no resuelve", () => {
    expect(cfg).toMatch(/webServer:\s*LOCAL_CI/);
    expect(cfg).toContain("backend.invalid");
    expect(cfg).toMatch(/testDir:\s*"\.\/e2e"/);
  });

  it("el spec navega solo con rutas relativas (baseURL) y no nombra ningun backend real", () => {
    expect(spec).not.toMatch(/page\.goto\(\s*["'`]https?:/);
    expect(spec).not.toMatch(/https?:\/\/[^\s"'`]*nadakki/);
    expect(spec).not.toMatch(/process\.env\.(BASE_URL|PLAYWRIGHT_BASE_URL)/);
  });

  it("el spec intercepta /api antes de navegar", () => {
    expect(spec.indexOf("await simularBackend(page, externas)")).toBeLessThan(spec.indexOf("await page.goto("));
  });
});
