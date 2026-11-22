/**
 * Fase 1 de marketing: guarda estatica (sin navegador) del spec centinela e2e/fase1/centinela.spec.ts.
 *
 * El spec es un .spec.ts de Playwright y no entra en el testMatch de jest, asi que el job «typecheck and changedSince
 * tests» (ci.yml) veia un .ts cambiado sin ningun test relacionado y fallaba con SOURCE_CHANGED_WITH_ZERO_RELATED_TESTS.
 * Este test es el que acompana al spec, como en tests/e2e/mf3-*: falla sin el spec y fija lo que hace que sea un centinela
 * y no una prueba hueca.
 */
import * as fs from "fs";
import * as path from "path";

const RUTA = path.join(process.cwd(), "e2e", "fase1", "centinela.spec.ts");

function codigo(): string {
  // sin comentarios de linea: las reglas se aplican al codigo, no a lo que dice un comentario
  return fs
    .readFileSync(RUTA, "utf8")
    .split("\n")
    .filter((l) => !l.trim().startsWith("//") && !l.trim().startsWith("*") && !l.trim().startsWith("/*"))
    .join("\n");
}

describe("centinela de la fase 1 (e2e/fase1/centinela.spec.ts)", () => {
  test("el spec existe", () => {
    expect(fs.existsSync(RUTA)).toBe(true);
  });

  test("el backend va interceptado: sesion simulada sobre backend.invalid, con marketing entre los cores", () => {
    const c = codigo();
    expect(c).toContain('const B = "http://backend.invalid"');
    expect(c).toMatch(/page\.route\(`\$\{B\}\/api\/v2\/auth\/refresh`/);
    expect(c).toMatch(/page\.route\(`\$\{B\}\/api\/v2\/auth\/me`/);
    expect(c).toMatch(/subscribed_cores:\s*\[[^\]]*"marketing"/);
    expect(c).toMatch(/await sesion\(page\);/);
  });

  test("registra los hosts que no son 127.0.0.1 ni backend.invalid y exige que no haya ninguno", () => {
    const c = codigo();
    expect(c).toMatch(/page\.on\("request"/);
    expect(c).toContain('["127.0.0.1", "backend.invalid"]');
    expect(c).toMatch(/expect\(externas[^)]*\)\.toEqual\(\[\]\)/);
  });

  test("entra por /marketing y espera los enlaces a campaigns y journeys", () => {
    const c = codigo();
    expect(c).toContain('page.goto("/marketing")');
    expect(c).toContain('a[href="/marketing/campaigns"]');
    expect(c).toContain('a[href="/marketing/journeys"]');
    expect(c).toMatch(/toBeVisible/);
  });

  test("no escribe URLs absolutas fuera de backend.invalid", () => {
    const hosts = [...codigo().matchAll(/\b(?:https?|wss?):\/\/([A-Za-z0-9.\-]+)/g)].map((m) => m[1]);
    expect(hosts.filter((h) => h !== "backend.invalid")).toEqual([]);
  });
});
