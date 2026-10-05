/** @jest-environment jsdom */

/**
 * P0-3 (auditoria Mapaal QA): la plantilla de carga se descarga desde el
 * Centro Operativo Y desde el importador, es el MISMO fichero v4, y el boton se
 * lee como activo en los dos temas.
 *
 * El defecto medido: texto emerald-200 sobre emerald-500/15 daba 1,11:1 en el
 * tema claro, y el enlace parecia deshabilitado. Aqui se fija que el boton usa
 * los tokens de accion y que esos tokens pasan AA (4,5:1) en claro y oscuro.
 */
import { render, screen } from "@testing-library/react";

import CentroOperativoPage from "@/app/centro-operativo/page";
import ImportarActivosPage from "@/app/autos/dealer/inventario/importar/page";
import { plantillaDeCarga } from "@/app/centro-operativo/contenido";
import { DCC_TOKENS } from "@/lib/dcc/tokens";

jest.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ tenant: { id: "mapaal" } }) }));
jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));
jest.mock("@/lib/access/hooks", () => ({
  useAccessEntitlementsBatch: () => ({ isPending: true, isLoading: true, data: undefined, error: null }),
}));
jest.mock("@tanstack/react-query", () => ({
  ...jest.requireActual("@tanstack/react-query"),
  useQuery: () => ({ data: undefined, isPending: false }),
  useMutation: () => ({ mutate: jest.fn(), reset: jest.fn(), isPending: false, isSuccess: false }),
}));

function luminancia(hex: string): number {
  const canales = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canales.map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contraste(a: string, b: string): number {
  const [hi, lo] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

const V4 = "/assets/centro-operativo/Plantilla_Activos_Mapaal_v4.xlsx";

it("el tenant de Mapaal declara la v4 oficial", () => {
  expect(plantillaDeCarga("mapaal")?.ruta).toBe(V4);
  expect(plantillaDeCarga(null)?.ruta).toBe(V4);
});

it("el Centro Operativo y el importador ofrecen el MISMO fichero, descargable", () => {
  const { unmount } = render(<CentroOperativoPage />);
  const centro = screen.getByTestId("centro-plantilla-descargar");
  expect(centro).toHaveAttribute("href", V4);
  expect(centro).toHaveAttribute("download");
  unmount();

  render(<ImportarActivosPage />);
  const importador = screen.getByTestId("import-plantilla-descargar");
  expect(importador).toHaveAttribute("href", V4);
  expect(importador).toHaveAttribute("download");
  expect(importador).toHaveTextContent("Descargar plantilla de carga (Excel)");
  expect(importador).not.toHaveAttribute("aria-disabled");
});

it("el boton usa los tokens de accion del tema, no el verde palido", () => {
  render(<CentroOperativoPage />);
  const clase = screen.getByTestId("centro-plantilla-descargar").className;
  expect(clase).toContain("bg-brand");
  expect(clase).toContain("text-on-brand");
  expect(clase).not.toMatch(/emerald-200|opacity-50|cursor-not-allowed/);
});

it("esos tokens pasan AA en los dos temas", () => {
  for (const tema of ["light", "dark"] as const) {
    const t = DCC_TOKENS[tema];
    expect(contraste(t["--dcc-action"], t["--dcc-on-action"])).toBeGreaterThanOrEqual(4.5);
  }
});
