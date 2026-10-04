/**
 * El guion de D2b (`e2e/mapaal/D2b.spec.ts`) contra el codigo de la app. Si
 * alguien renombra un testid, cambia una etiqueta o vuelve a enlazar /tenants
 * desde el menu de la Suite, falla aqui y no en el RESULT_D2b del tenant QA.
 */
import fs from "fs";
import path from "path";
import {
  DOMINIOS_CATALOGO,
  LEGAL_HUB,
  RUTA_DEALER,
  RUTA_TENANTS,
  SUITE_OPERATIVA,
  TENANT_QA,
  TENANTS_INVENTADOS,
  TESTIDS,
  enPanelDealer,
} from "@/e2e/mapaal/d2b-guion";
import { TENANT_QA as TENANT_QA_D9 } from "@/e2e/mapaal/d9-guion";
import { DEALER_MANAGEMENT_ROOT } from "@/lib/autos-portal/routes";

const fuente = (rel: string) => fs.readFileSync(path.join(process.cwd(), rel), "utf8");

describe("D2b guion vs app", () => {
  it("el tenant QA es el mismo que el de los demas specs", () => {
    expect(TENANT_QA).toBe(TENANT_QA_D9);
  });

  it("la redireccion del gate va a la ruta que el spec reconoce como panel del dealer", () => {
    expect(RUTA_DEALER).toBe(DEALER_MANAGEMENT_ROOT);
    expect(enPanelDealer(DEALER_MANAGEMENT_ROOT)).toBe(true);
    expect(enPanelDealer(`${DEALER_MANAGEMENT_ROOT}/inventario`)).toBe(true);
    expect(enPanelDealer("/autos/dealers")).toBe(false);
    expect(enPanelDealer("/")).toBe(false);
  });

  it("el gate de la Suite pinta los testids que el spec espera", () => {
    const gate = fuente("components/dealer/DealerSuiteGate.tsx");
    expect(gate).toContain(`"${TESTIDS.suiteVerificando}"`);
    expect(gate).toContain(`"${TESTIDS.suiteRedirigiendo}"`);
    expect(gate).toContain("router.replace(DEALER_MANAGEMENT_ROOT)");
    expect(fuente("components/forge/layout/GlobalForgeAppShell.tsx")).toContain("<DealerSuiteGate>");
  });

  it("los textos que el spec busca para detectar la Suite existen en la Suite", () => {
    expect(fuente("components/forge/layout/ForgeGlobalCoresSidebar.tsx")).toContain(`>${SUITE_OPERATIVA}<`);
    expect(fuente("components/forge/layout/forge-global-sidebar-nav.ts")).toContain(`label: "${LEGAL_HUB}"`);
  });

  it("las metricas de plataforma de Inicio llevan el testid y van tras esPlataforma", () => {
    const inicio = fuente("app/page.tsx");
    expect(inicio).toContain(`data-testid="${TESTIDS.metricasPlataforma}"`);
    expect(inicio).toContain(DOMINIOS_CATALOGO);
    const gate = inicio.indexOf("{esPlataforma ? (");
    expect(gate).toBeGreaterThan(-1);
    expect(gate).toBeLessThan(inicio.indexOf(TESTIDS.metricasPlataforma));
  });

  it("el layout de /tenants cierra la puerta con los testids del spec", () => {
    const layout = fuente("app/tenants/layout.tsx");
    expect(layout).toContain(`data-testid="${TESTIDS.tenantsVerificando}"`);
    expect(layout).toContain(`data-testid="${TESTIDS.tenantsSoloPlataforma}"`);
    expect(layout).toContain("esPersonalDePlataforma(allRoles)");
  });

  it("los tenants inventados son los de TENANTS_INITIAL", () => {
    const pagina = fuente("app/tenants/page.tsx");
    for (const nombre of TENANTS_INVENTADOS) expect(pagina).toContain(`name: "${nombre}"`);
  });

  it("'Cambiar tenant' de la Suite ya no enlaza a /tenants", () => {
    const sidebar = fuente("components/forge/layout/ForgeGlobalCoresSidebar.tsx");
    expect(sidebar).toContain("Cambiar tenant");
    expect(sidebar).not.toContain(`href="${RUTA_TENANTS}"`);
    expect(sidebar).not.toContain(`"${RUTA_TENANTS}"`);
  });
});
