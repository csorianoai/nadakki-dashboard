/**
 * D1 (regresion): el usuario QA inicia sesion donde existe su tenant.
 *
 * RESULT_D1=FAIL en 3fa62a90: D1.spec.ts hacia `goto("/login")` en BASE_URL
 * (mapaal.nadakki.com). Ese host fija el tenant `mapaal` en el login
 * (DEALER-ADMIN-HOST-01) y el usuario QA es de `mapaal-qa`, asi que la respuesta
 * era 401 y el inventario nunca se llegaba a abrir. Si el spec vuelve a iniciar
 * sesion en BASE_URL, o el helper deja de ir al host universal, falla aqui.
 */
import { readFileSync } from "fs";
import path from "path";

import { resolveDealerAdminHost } from "@/lib/dealer-management/admin-host";
import { ORIGEN_UNIVERSAL, SLUG_QA, origenDeLogin } from "../../e2e/mapaal/d9-guion";

const raiz = path.resolve(__dirname, "../..");
const fuente = (rel: string) => readFileSync(path.join(raiz, rel), "utf8");

describe("D1: el usuario QA inicia sesion donde su tenant existe", () => {
  it("con BASE_URL = mapaal.nadakki.com el login va al host universal", () => {
    const prod = "https://mapaal.nadakki.com"; // superloop-evidence.yml: BASE_URL
    const host = resolveDealerAdminHost(new URL(prod).hostname);
    expect(host).toEqual({ mode: "dealer_subdomain", tenantSlug: "mapaal" });
    expect(host.mode === "dealer_subdomain" && host.tenantSlug).not.toBe(SLUG_QA);
    expect(origenDeLogin(prod, host)).toBe(ORIGEN_UNIVERSAL);
  });

  it("D1.spec.ts no inicia sesion por su cuenta: usa iniciarSesionQA con BASE_URL", () => {
    const spec = fuente("e2e/mapaal/D1.spec.ts");
    expect(spec).toContain('from "./sesion-qa"');
    expect(spec).toContain("iniciarSesionQA(browser, { baseUrl: BASE_URL");
    expect(spec).not.toMatch(/goto\(\s*["'`][^"'`]*\/login["'`]\s*\)/);
    expect(spec).not.toMatch(/input\[type="email"\]/);
    // La pagina del test es la de la sesion trasladada, no el fixture `page`.
    expect(spec).not.toMatch(/async \(\{\s*page\s*,?\s*\}\)/);
    expect(spec).toContain('console.log("RESULT_D1=PASS")');
  });

  it("iniciarSesionQA va por origenDeLogin, escribe el tenant QA y lleva la sesion a BASE_URL", () => {
    const helper = fuente("e2e/mapaal/sesion-qa.ts");
    expect(helper).toContain("origenDeLogin(baseUrl, host)");
    expect(helper).toContain("goto(`${origenLogin}/login`)");
    expect(helper).toContain("getByPlaceholder(PLACEHOLDER_TENANT, { exact: true })");
    expect(helper).toContain("fill(SLUG_QA)");
    expect(helper).toContain("huellaDespliegue(");
    expect(helper).toContain("toBe(TENANT_QA)");
    expect(helper).toContain("origin: new URL(baseUrl).origin");
  });
});
