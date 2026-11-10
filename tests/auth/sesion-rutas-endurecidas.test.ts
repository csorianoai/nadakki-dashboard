/**
 * Guarda de codigo: las pantallas que llaman a rutas del backend que ahora exigen sesion y tenant propio
 * (#2639 gates, #2660 usage, #2662 autos admin, #2666 editorial-config, #2667 tenant config/modules/onboard-profile)
 * deben ir por apiFetch (Bearer + renovacion), no por fetch plano. Un fetch plano a estas rutas da 401 con el backend nuevo.
 * Solo cubre los llamadores conocidos el 10-nov-2026; una llamada nueva con otra forma de URL no la vería este test.
 */
import { readFileSync } from "fs";
import { join } from "path";

const RAIZ = join(__dirname, "..", "..");
const leer = (ruta: string) => readFileSync(join(RAIZ, ruta), "utf8");

// fetch( sin prefijo de letra (apiFetch( no cuenta) seguido de una URL de las rutas endurecidas.
const FETCH_PLANO_A_RUTA_ENDURECIDA =
  /(?<![A-Za-z_.])fetch\(\s*[`"'][^`"']*\/api\/v1\/tenants\/[^`"']*\/(modules|config)\b/;

const PANTALLAS = [
  "hooks/useTenantModules.ts",
  "app/admin/config/page.tsx",
  "app/marketing/integrations/page.tsx",
];

describe("llamadores de rutas endurecidas del backend", () => {
  it.each(PANTALLAS)("%s no usa fetch plano para tenants/{id}/(modules|config) y usa apiFetch", (ruta) => {
    const fuente = leer(ruta);
    expect(FETCH_PLANO_A_RUTA_ENDURECIDA.test(fuente)).toBe(false);
    expect(fuente).toMatch(/apiFetch\(/);
    expect(fuente).toMatch(/from "@\/lib\/api\/fetch-client"/);
  });

  it("el detector reconoce el patron malo (control)", () => {
    expect(FETCH_PLANO_A_RUTA_ENDURECIDA.test("fetch(`/api/v1/tenants/${id}/modules`, {")).toBe(true);
    expect(FETCH_PLANO_A_RUTA_ENDURECIDA.test("apiFetch(`/api/v1/tenants/${id}/modules`, {")).toBe(false);
  });

  it("gates y autos admin siguen con apiFetch", () => {
    expect(leer("app/admin/gates/page.tsx")).toMatch(/apiFetch\(\s*["`]\/api\/v1\/gates/);
    expect(leer("lib/autos-portal/admin-api.ts")).toMatch(/await apiFetch\(path/);
  });
});
