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

describe("playwright.config: puerto local sin colision entre corridas (regresion MF3-T3)", () => {
  // Causa: un `next start` huerfano de una corrida anterior (muerta con 137) seguia en el puerto fijo 3109 y la
  // siguiente evidencia fallaba con "http://127.0.0.1:3109/login is already used" sin llegar a medir nada.
  it("no fija el puerto 3109 como unico valor", () => {
    expect(CFG).not.toMatch(/\?\?\s*3109\b/);
  });
  it("publica el puerto elegido en process.env para que los workers calculen la misma baseURL", () => {
    expect(CFG).toMatch(/process\.env\.PLAYWRIGHT_LOCAL_PORT\s*=/);
  });
});
