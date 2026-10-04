/**
 * D8: lo que `e2e/mapaal/D8.spec.ts` busca en pantalla existe en el codigo de
 * la app. Si alguien renombra un testid o cambia un texto, falla aqui y no en
 * el RESULT_D8 contra el tenant QA.
 */
import { readFileSync } from "fs";
import path from "path";

import {
  ARCA_TITULO as ARCA_TITULO_APP,
  FISCAL_PATH,
  estadoFiscalDesdeRespuesta,
} from "@/lib/contable/fiscal-dispatch";
import { resolveDealerAdminHost } from "@/lib/dealer-management/admin-host";
import {
  ARCA_TITULO,
  AR_NOT_CONFIGURED,
  PREFIJO_FISCAL,
  PREFIJO_REFRESH,
  REINTENTAR,
  RUTAS,
  SESION_FALLIDA,
  SESION_VERIFICANDO,
  TESTIDS,
  TITULOS,
  esLogin,
  esPeticionFiscal,
  esRefresh,
  fallaFiscalAR,
} from "../../e2e/mapaal/d8-guion";
import {
  ORIGEN_UNIVERSAL,
  SLUG_QA,
  origenDeLogin,
} from "../../e2e/mapaal/d9-guion";

const raiz = path.resolve(__dirname, "../..");
const fuente = (rel: string) => readFileSync(path.join(raiz, rel), "utf8");

describe("D8 guion: selectores y textos contra el codigo de la app", () => {
  it("cada ruta tiene su pagina", () => {
    for (const ruta of Object.values(RUTAS)) {
      expect(fuente(`app${ruta}/page.tsx`)).toContain("export default");
    }
  });

  it("los titulos son los de cada pantalla", () => {
    expect(fuente("components/contable/PlanCuentasClient.tsx")).toContain(
      `title="${TITULOS.plan}"`,
    );
    expect(fuente("components/contable/LibroMayorClient.tsx")).toContain(
      `title="${TITULOS.libro}"`,
    );
    expect(fuente("components/contable/BalanceComprobacionClient.tsx")).toContain(
      `title="${TITULOS.balance}"`,
    );
  });

  it("los textos de sesion son los de ProtectedRoute", () => {
    const protegida = fuente("components/forge/auth/ProtectedRoute.tsx");
    expect(protegida).toContain(SESION_FALLIDA);
    expect(protegida).toContain(SESION_VERIFICANDO);
    expect(protegida).toContain(REINTENTAR);
  });

  it("los testids existen en sus componentes", () => {
    const aviso = fuente("components/contable/FacturacionElectronicaAviso.tsx");
    expect(aviso).toContain(`data-testid="${TESTIDS.arca}"`);
    expect(aviso).toContain(`data-testid="${TESTIDS.problema}"`);
    expect(fuente("components/contable/ErrorConReintentar.tsx")).toContain(
      `data-testid="${TESTIDS.errorReintentar}"`,
    );
  });

  it("el titulo de ARCA y el GET fiscal son los de la app", () => {
    expect(ARCA_TITULO).toBe(ARCA_TITULO_APP);
    expect(FISCAL_PATH.startsWith(PREFIJO_FISCAL)).toBe(true);
    expect(fuente("lib/api/auth-v2.ts")).toContain(`"${PREFIJO_REFRESH}"`);
  });
});

describe("D8 guion: lectura del GET fiscal", () => {
  const cuerpoAR = JSON.stringify({
    detail: { error: AR_NOT_CONFIGURED, country: "AR" },
  });

  it("acepta el 409 AR_NOT_CONFIGURED, el mismo que la app pinta como ARCA", () => {
    expect(fallaFiscalAR(409, cuerpoAR)).toBeNull();
    expect(estadoFiscalDesdeRespuesta(409, JSON.parse(cuerpoAR)).tipo).toBe("arca");
  });

  it("rechaza lo que la app no pinta como ARCA", () => {
    expect(fallaFiscalAR(200, "{}")).toMatch(/status 200/);
    expect(
      fallaFiscalAR(
        409,
        JSON.stringify({ detail: { error: "FISCAL_COUNTRY_NOT_CONFIGURED" } }),
      ),
    ).toMatch(/FISCAL_COUNTRY_NOT_CONFIGURED/);
    expect(fallaFiscalAR(409, "<html>")).toMatch(/no es JSON/);
    expect(fallaFiscalAR(409, `Upstream error 409: ${cuerpoAR}`)).toMatch(
      /Upstream error/,
    );
  });

  it("clasifica las URLs", () => {
    expect(esPeticionFiscal(`https://qa.example${FISCAL_PATH}`)).toBe(true);
    expect(esPeticionFiscal("https://qa.example/api/v1/contable/cuentas")).toBe(false);
    expect(esRefresh("https://qa.example/api/v2/auth/refresh")).toBe(true);
    expect(esRefresh("https://qa.example/api/v2/auth/login")).toBe(false);
    expect(esLogin("/login")).toBe(true);
    expect(esLogin(RUTAS.libro)).toBe(false);
  });
});

/**
 * Regresion del RESULT_D8=FAIL en 3fa62a90: el login se quedaba en /login con
 * "Credenciales invalidas" y D8.1 agotaba `waitForURL`. BASE_URL es
 * mapaal.nadakki.com; ahi el login manda tenant_slug=mapaal y el usuario QA es
 * de mapaal-qa. Si el spec vuelve a iniciar sesion en el host de BASE_URL sin
 * mirar a que tenant pertenece, esto se pone rojo antes de llegar a produccion.
 */
describe("D8 spec: el usuario QA inicia sesion donde su tenant existe", () => {
  const PROD = "https://mapaal.nadakki.com"; // superloop-evidence.yml: BASE_URL
  // Espacios colapsados: que prettier parta una llamada no rompe la busqueda.
  const spec = fuente("e2e/mapaal/D8.spec.ts")
    .replace(/\s+/g, " ")
    .replace(/\( /g, "(")
    .replace(/,? \)/g, ")")
    .replace(/, \}/g, " }");

  it("en el BASE_URL del loop, el login va al host universal", () => {
    const host = resolveDealerAdminHost(new URL(PROD).hostname);
    expect(host).toEqual({ mode: "dealer_subdomain", tenantSlug: "mapaal" });
    expect(SLUG_QA).not.toBe(host.mode === "dealer_subdomain" && host.tenantSlug);
    expect(origenDeLogin(PROD, host)).toBe(ORIGEN_UNIVERSAL);
  });

  it("el spec elige el host del login con origenDeLogin y lleva la sesion a BASE_URL", () => {
    expect(spec).toContain("origenDeLogin(BASE_URL, host)");
    expect(spec).toContain("resolveDealerAdminHost(new URL(BASE_URL).hostname)");
    expect(spec).toContain("goto(`${origenLogin}/login`)");
    expect(spec).not.toMatch(/goto\(`\$\{BASE_URL\}\/login`\)/);
    expect(spec).toContain("storageState");
    expect(spec).toContain("huellaDespliegue");
  });

  it("el spec escribe el tenant QA con placeholder exacto y comprueba el tenant de la sesion", () => {
    expect(spec).toContain("getByPlaceholder(PLACEHOLDER_TENANT, { exact: true })");
    expect(spec).not.toMatch(/getByPlaceholder\("tu-institucion"\)/);
    expect(spec).toContain("campoTenant.fill(SLUG_QA)");
    expect(spec).toContain('getItem("nadakki_tenant_id")');
    expect(spec).toContain("TENANT_QA");
  });
});
