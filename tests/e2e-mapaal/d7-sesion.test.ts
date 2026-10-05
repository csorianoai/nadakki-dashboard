/**
 * Regresion del RESULT_D7=FAIL: `page.waitForURL` agoto 60 s en /login. D7 tenia
 * su propio login contra BASE_URL (mapaal.nadakki.com), que fija el tenant
 * `mapaal`; el usuario QA es de `mapaal-qa` y recibia 401. Lo reintrodujo el
 * login propio de D7, copiado antes de que existiera `iniciarSesionQA`
 * (sesion-qa.ts, el enfoque de D3/D5/D8/D9). Si D7 vuelve a hacer su login, esto
 * se pone rojo antes de llegar al tenant QA.
 */
import { readFileSync } from "fs";
import path from "path";

const raiz = path.resolve(__dirname, "../..");
const fuente = (rel: string) => readFileSync(path.join(raiz, rel), "utf8");

describe("D7: el usuario QA inicia sesion donde existe su tenant", () => {
  const spec = fuente("e2e/mapaal/D7.spec.ts");

  it("D7.spec.ts usa iniciarSesionQA", () => {
    expect(spec).toContain('from "./sesion-qa"');
    expect(spec).toContain("iniciarSesionQA(browser,");
  });

  it("D7.spec.ts no hace su propio login", () => {
    expect(spec).not.toContain("/login");
    expect(spec).not.toContain("getByPlaceholder");
    expect(spec).not.toContain('input[type="email"]');
    expect(spec).not.toContain('input[type="password"]');
    expect(spec).not.toMatch(/Iniciar Sesi/i);
  });

  it("iniciarSesionQA entra por el host universal y exige el tenant QA", () => {
    const sesion = fuente("e2e/mapaal/sesion-qa.ts");
    expect(sesion).toContain("origenDeLogin(baseUrl, host)");
    expect(sesion).toContain("fill(SLUG_QA)");
    expect(sesion).toContain("toBe(TENANT_QA)");
  });
});

/**
 * Regresion (evidence D7 b182d618): el primer intento se quedo 30 s en "No se
 * pudo verificar la sesion" sin CTA y solo paso en el reintento de Playwright.
 * El spec recupera por "Reintentar", como D8.3, en vez de depender del retry.
 */
describe("D7: un fallo transitorio de verificar la sesion no tumba el spec", () => {
  const spec = fuente("e2e/mapaal/D7.spec.ts");

  it("D7.spec.ts reconoce la pantalla de sesion fallida y pulsa Reintentar", () => {
    const sesion = fuente("e2e/mapaal/sesion-qa.ts");
    expect(sesion).toContain("SESION_FALLIDA");
    expect(sesion).toContain('name: "Reintentar"');
    // Cada navegacion (inventario, importar, inventario tras aplicar) recupera.
    expect(spec.match(/esperarConReintento\(page,/g)?.length).toBeGreaterThanOrEqual(3);
  });

  it("la pantalla de la app sigue diciendo lo que el spec busca", () => {
    const { SESION_FALLIDA } = require("../../e2e/mapaal/d8-guion");
    expect(fuente("components/forge/auth/ProtectedRoute.tsx")).toContain(SESION_FALLIDA);
    expect(fuente("components/forge/auth/ProtectedRoute.tsx")).toContain("Reintentar");
  });
});
