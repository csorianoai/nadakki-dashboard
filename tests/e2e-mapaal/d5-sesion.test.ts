/**
 * Regresion del RESULT_D5=FAIL en 3fa62a90: `page.waitForURL` agoto 90 s en
 * /login. BASE_URL es mapaal.nadakki.com: ahi no hay campo de tenant, el
 * `getByPlaceholder("tu-institucion")` sin `exact` casaba con el email y le
 * escribia el slug (submit bloqueado); y ese host fija el tenant `mapaal`, donde
 * el usuario QA no existe. Si D5 vuelve a hacer su propio login, esto se pone
 * rojo antes de llegar a produccion.
 */
import { readFileSync } from "fs";
import path from "path";

import { resolveDealerAdminHost } from "@/lib/dealer-management/admin-host";
import { ORIGEN_UNIVERSAL, PLACEHOLDER_TENANT, origenDeLogin } from "../../e2e/mapaal/d9-guion";

const raiz = path.resolve(__dirname, "../..");
const fuente = (rel: string) => readFileSync(path.join(raiz, rel), "utf8");

describe("D5: el usuario QA inicia sesion donde existe su tenant", () => {
  const PROD = "https://mapaal.nadakki.com"; // superloop-evidence.yml: BASE_URL

  it("desde el subdominio de Mapaal el login va por el host universal", () => {
    expect(origenDeLogin(PROD, resolveDealerAdminHost(new URL(PROD).hostname))).toBe(ORIGEN_UNIVERSAL);
  });

  it("D5.spec.ts no hace su propio login: usa iniciarSesionQA", () => {
    const spec = fuente("e2e/mapaal/D5.spec.ts");
    expect(spec).toContain('from "./sesion-qa"');
    expect(spec).toContain("iniciarSesionQA(browser,");
    expect(spec).not.toContain("/login");
    expect(spec).not.toContain("getByPlaceholder");
    expect(spec).not.toContain("waitForURL");
  });

  it("iniciarSesionQA entra por origenDeLogin, con placeholder exacto, y lleva la sesion a BASE_URL", () => {
    const sesion = fuente("e2e/mapaal/sesion-qa.ts");
    expect(sesion).toContain("origenDeLogin(baseUrl, host)");
    expect(sesion).toContain("goto(`${origenLogin}/login`)");
    expect(sesion).toContain("getByPlaceholder(PLACEHOLDER_TENANT, { exact: true })");
    expect(sesion).toContain("fill(SLUG_QA)");
    expect(sesion).toContain("huellaDespliegue(");
    expect(sesion).toContain("toBe(TENANT_QA)");
    expect(sesion).toContain("origin: new URL(baseUrl).origin");
    expect(sesion).not.toMatch(/getByPlaceholder\("tu-institucion"\)/);
  });

  it("el placeholder del email contiene el del tenant: sin exact casarian los dos", () => {
    const login = fuente("app/(auth)/login/page.tsx");
    expect(login).toContain(`placeholder="${PLACEHOLDER_TENANT}"`);
    expect(login).toMatch(new RegExp(`placeholder="[^"]+${PLACEHOLDER_TENANT}[^"]*"`));
  });
});
