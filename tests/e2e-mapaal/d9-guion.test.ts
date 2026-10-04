/**
 * D9: lo que `e2e/mapaal/D9.spec.ts` busca en pantalla existe en el codigo de
 * la app. Si alguien renombra un testid, un aria-label o mueve el enlace del
 * menu, falla aqui y no en el RESULT_D9 contra el tenant QA.
 */
import { readFileSync } from "fs";
import path from "path";

import { contenidoCentroOperativo } from "@/app/centro-operativo/contenido";
import { DEALER_NAV_GROUPS } from "@/components/dealer-management/shell/dealer-nav";
import { isDealerChromePath } from "@/lib/autos-portal/routes";
import {
  ANCLA_PRIMEROS_PASOS, CTA_PRIMEROS_PASOS, ENLACE_MENU, GRUPO_MENU, NAV, RUTAS,
  SUITE_OPERATIVA, TENANT_QA, TESTIDS, esInventario, esXlsx, fallosDePlantilla,
  primerosPasosEsperado, vehiculosEnRespuesta,
} from "../../e2e/mapaal/d9-guion";

const raiz = path.resolve(__dirname, "../..");
const fuente = (rel: string) => readFileSync(path.join(raiz, rel), "utf8");

describe("D9 guion: selectores y textos contra el codigo de la app", () => {
  it("el boton de Primeros pasos es el del Inicio y apunta al ancla", () => {
    // Leido del fuente: importar el componente arrastra el cliente de la API.
    const inicio = fuente("components/dealer/PrimerosPasosInicio.tsx");
    expect(inicio).toContain(`PRIMEROS_PASOS_BOTON = "${CTA_PRIMEROS_PASOS}"`);
    expect(inicio).toContain(`PRIMEROS_PASOS_HREF = "${RUTAS.centro}#${ANCLA_PRIMEROS_PASOS}"`);
    expect(contenidoCentroOperativo(TENANT_QA).bloques.map((b) => b.id)).toContain(ANCLA_PRIMEROS_PASOS);
  });

  it("Centro Operativo esta en el grupo Operacion del menu del dealer", () => {
    const grupo = DEALER_NAV_GROUPS.find((g) => g.label === GRUPO_MENU);
    expect(grupo?.items).toEqual(
      expect.arrayContaining([expect.objectContaining({ href: RUTAS.centro, label: ENLACE_MENU, capability: null })]),
    );
  });

  it("el Centro Operativo lleva el chrome del dealer", () => {
    expect(isDealerChromePath(RUTAS.centro)).toBe(true);
    expect(isDealerChromePath(RUTAS.inicio)).toBe(true);
  });

  it("las navegaciones que el spec distingue tienen esos aria-label", () => {
    expect(fuente("components/dealer-management/shell/DealerSidebar.tsx")).toContain(`aria-label="${NAV.dealer}"`);
    const suite = fuente("components/forge/layout/ForgeGlobalCoresSidebar.tsx");
    expect(suite).toContain(`aria-label="${NAV.suite}"`);
    expect(suite).toContain(`aria-label="${NAV.suiteModulos}"`);
    expect(suite).toContain(`>${SUITE_OPERATIVA}<`);
    expect(fuente("components/nav/TopNav.tsx")).toContain(`aria-label="${NAV.marketplace}"`);
  });

  it("los testids existen donde el spec los busca", () => {
    const pagina = fuente("app/centro-operativo/page.tsx");
    for (const id of [TESTIDS.plantilla, TESTIDS.tiposCosto, TESTIDS.cuentas, TESTIDS.reglaFinal])
      expect(pagina).toContain(`data-testid="${id}"`);
    expect(pagina).toContain("data-testid={`centro-bloque-${bloque.id}`}");
    expect(pagina).toContain("data-testid={`centro-advertencia-${bloque.id}`}");
    expect(pagina).toContain("id={bloque.id}");
    expect(TESTIDS.bloque("x")).toBe("centro-bloque-x");
    expect(TESTIDS.advertencia("x")).toBe("centro-advertencia-x");

    const inicio = fuente("components/dealer/PrimerosPasosInicio.tsx");
    expect(inicio).toContain(`data-testid="${TESTIDS.primerosPasosInicio}"`);
    expect(inicio).toContain(`data-testid="${TESTIDS.primerosPasosCta}"`);
    expect(fuente("app/autos/dealer/page.tsx")).toContain(`"${TESTIDS.accesoLibre}"`);
    expect(fuente("components/dealer-management/shell/DealerSidebar.tsx")).toContain(
      `data-testid="${TESTIDS.sidebar}"`,
    );
  });

  it("el GET del inventario es el de fetchDealerInventory", () => {
    expect(fuente("lib/dealer-management/inventory.ts")).toContain("/api/v1/autos/dealers/${encodeURIComponent(dealerId)}/vehicles");
    expect(esInventario("https://x.test/api/v1/autos/dealers/d-1/vehicles", "GET")).toBe(true);
    expect(esInventario("https://x.test/api/v1/autos/dealers/d-1/vehicles?limit=5", "get")).toBe(true);
    expect(esInventario("https://x.test/api/v1/autos/dealers/d-1/vehicles", "POST")).toBe(false);
    expect(esInventario("https://x.test/api/v1/autos/dealers/d-1/vehicles/v-1", "GET")).toBe(false);
  });
});

describe("D9 guion: lectura de las respuestas", () => {
  it("cuenta vehiculos como fetchDealerInventory", () => {
    expect(vehiculosEnRespuesta([])).toBe(0);
    expect(vehiculosEnRespuesta({ vehicles: [] })).toBe(0);
    expect(vehiculosEnRespuesta({ vehicles: [{ id: "a" }, { id: 2 }, { id: "" }, null, {}] })).toBe(2);
    expect(vehiculosEnRespuesta({ detail: "error" })).toBeNull();
    expect(vehiculosEnRespuesta(null)).toBeNull();
  });

  it("Primeros pasos solo con respuesta buena y cero vehiculos", () => {
    expect(primerosPasosEsperado([{ status: 200, vehiculos: 0 }])).toBe(true);
    expect(primerosPasosEsperado([{ status: 200, vehiculos: 3 }])).toBe(false);
    expect(primerosPasosEsperado([{ status: 500, vehiculos: null }])).toBe(false);
    expect(primerosPasosEsperado([{ status: 200, vehiculos: null }])).toBe(false);
    // Sin peticion (varias asignaciones, sin acceso): no se adivina.
    expect(primerosPasosEsperado([])).toBe(false);
  });

  it("una plantilla vale solo si es un .xlsx real con la version en el nombre", () => {
    const zip = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14]);
    const plantilla = { ruta: "/assets/centro-operativo/plantilla-carga-mapaal-v4.xlsx", version: "v4" };
    expect(esXlsx(zip)).toBe(true);
    expect(fallosDePlantilla(plantilla, { status: 200, bytes: zip })).toEqual([]);
    expect(fallosDePlantilla(plantilla, { status: 404, bytes: new Uint8Array() })).toEqual(["la plantilla responde 404"]);
    expect(fallosDePlantilla(plantilla, { status: 200, bytes: new Uint8Array() })).toEqual(["la plantilla pesa 0 bytes"]);
    expect(fallosDePlantilla(plantilla, { status: 200, bytes: new TextEncoder().encode("<html>") })).toHaveLength(1);
    expect(fallosDePlantilla({ ...plantilla, version: "v3" }, { status: 200, bytes: zip })).toHaveLength(1);
  });

  it("si el archivo de datos declara plantilla, su ruta existe en public/", () => {
    for (const bloque of contenidoCentroOperativo(TENANT_QA).bloques) {
      if (!bloque.plantilla) continue;
      const bytes = new Uint8Array(readFileSync(path.join(raiz, "public", bloque.plantilla.ruta)));
      expect(fallosDePlantilla(bloque.plantilla, { status: 200, bytes })).toEqual([]);
    }
  });
});
