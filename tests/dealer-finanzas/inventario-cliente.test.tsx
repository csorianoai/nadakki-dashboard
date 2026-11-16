/**
 * @jest-environment jsdom
 *
 * F4E-2 PARTE 1/3: cliente de inventario-por-unidad (F4E-1) y etiquetas legibles en Analisis de costos.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import AnalisisCostosPage from "@/app/autos/dealer/finanzas/analisis-costos/page";
import {
  SIN_FILTROS,
  etiquetaUnidad,
  fetchInventario,
  fetchInventarioCsv,
  filtrosDeParams,
  inventarioCsvPath,
  inventarioPath,
  parseInventario,
} from "@/app/autos/dealer/finanzas/inventario/inventario";
import { tokenStorage } from "@/lib/auth/token-storage";
import { resetDealerAccessMemoryForTests, setDealerAccessContext } from "@/lib/dealer/access-context";

jest.mock("next/navigation", () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));
jest.mock("@/lib/dealer-management/useDealerManagementBranding", () => ({
  useDealerManagementBranding: () => ({ data: { locale: "es-DO", currency: "DOP" } }),
}));
jest.mock("recharts", () => {
  const Nulo = ({ children }: { children?: ReactNode }) => <div>{children}</div>;
  return { ResponsiveContainer: Nulo, BarChart: Nulo, Bar: Nulo, Cell: Nulo, CartesianGrid: Nulo, Tooltip: Nulo, XAxis: Nulo, YAxis: Nulo };
});

const UUID = "3f2b8a52-6f1c-4d0e-9a57-0c1d2e3f4a5b";
const UUID_HUERFANO = "9c1d7e44-0b2a-4c3d-8e6f-1a2b3c4d5e6f";
const INVENTARIO = {
  moneda: "dop", total: 900, totales_por_moneda: [{ currency: "DOP", total: 900 }],
  filas: [{
    vehicle_id: UUID, stock_number: "S-001", make: "Toyota", model: "Hilux", year: 2021, status: "disponible",
    acquired_at: "2026-09-10T00:00:00Z", dias_en_stock: 40, costos: [{ currency: "DOP", total: "900" }],
  }],
};

describe("rutas y filtros", () => {
  it("sin filtros no manda query", () => {
    expect(inventarioPath(SIN_FILTROS)).toBe("/api/v1/contable/reports/inventario-por-unidad");
  });
  it("los filtros viajan con los nombres del contrato de F4E-1", () => {
    const f = { marca: " Toyota ", estado: "disponible", desde: "2026-01-01", hasta: "2026-06-30" };
    const p = new URLSearchParams(inventarioPath(f).split("?")[1]);
    expect(p.get("marca")).toBe("Toyota");
    expect(p.get("estado")).toBe("disponible");
    expect(p.get("adquirido_desde")).toBe("2026-01-01");
    expect(p.get("adquirido_hasta")).toBe("2026-06-30");
    expect(p.get("formato")).toBeNull();
  });
  it("el CSV es el mismo pedido con formato=csv", () => {
    const f = { ...SIN_FILTROS, marca: "Honda", estado: "vendido" };
    const p = new URLSearchParams(inventarioCsvPath(f).split("?")[1]);
    expect(p.get("formato")).toBe("csv");
    expect(p.get("marca")).toBe("Honda");
    expect(p.get("estado")).toBe("vendido");
  });
  it("la URL de la vista se lee con los mismos nombres", () => {
    expect(filtrosDeParams(new URLSearchParams("marca=Kia&adquirido_desde=2026-02-01"))).toEqual({
      marca: "Kia", estado: "", desde: "2026-02-01", hasta: "",
    });
  });
});

describe("parseInventario", () => {
  it("normaliza moneda y numeros; sin precio ni margen no hay margen", () => {
    const r = parseInventario(INVENTARIO);
    expect(r.moneda).toBe("DOP");
    expect(r.filas[0].costos).toEqual([{ currency: "DOP", total: 900 }]);
    expect(r.hayMargen).toBe(false);
  });
  it("con margen en alguna fila hayMargen es true", () => {
    const r = parseInventario({ ...INVENTARIO, filas: [{ ...INVENTARIO.filas[0], precio_lista: 1500, moneda_precio: "DOP", margen_esperado: 600 }] });
    expect(r.hayMargen).toBe(true);
    expect(r.filas[0].margen_esperado).toBe(600);
  });
  it("sin moneda o sin total falla cerrado", () => {
    expect(() => parseInventario({ ...INVENTARIO, moneda: "" })).toThrow("INVENTARIO_RESPUESTA_INVALIDA");
    expect(() => parseInventario({ ...INVENTARIO, total: null })).toThrow("INVENTARIO_RESPUESTA_INVALIDA");
    expect(() => parseInventario(null)).toThrow("INVENTARIO_RESPUESTA_INVALIDA");
  });
  it("la etiqueta de la unidad es marca modelo anio y stock, nunca el id", () => {
    const [f] = parseInventario(INVENTARIO).filas;
    expect(etiquetaUnidad(f)).toBe("Toyota Hilux 2021 · S-001");
    expect(etiquetaUnidad({ ...f, make: "", model: "", year: null, stock_number: "" })).not.toContain(UUID);
  });
});

describe("peticiones", () => {
  beforeEach(() => {
    tokenStorage.clearTokens();
  });
  it("fetchInventario pide el JSON con los filtros y falla con HTTP_<estado>", async () => {
    global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => INVENTARIO })) as unknown as typeof fetch;
    await fetchInventario({ ...SIN_FILTROS, marca: "Toyota" });
    expect(String((global.fetch as jest.Mock).mock.calls[0][0])).toContain("marca=Toyota");
    global.fetch = jest.fn(async () => ({ ok: false, status: 403, json: async () => ({}) })) as unknown as typeof fetch;
    await expect(fetchInventario(SIN_FILTROS)).rejects.toThrow("HTTP_403");
  });
  it("fetchInventarioCsv devuelve el cuerpo del endpoint con formato=csv", async () => {
    const blob = new Blob(["a,b"]);
    global.fetch = jest.fn(async () => ({ ok: true, status: 200, blob: async () => blob })) as unknown as typeof fetch;
    await expect(fetchInventarioCsv({ ...SIN_FILTROS, estado: "vendido" })).resolves.toBe(blob);
    expect(String((global.fetch as jest.Mock).mock.calls[0][0])).toContain("formato=csv");
  });
});

describe("Analisis de costos: la barra por vehiculo no se etiqueta con el UUID", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
    setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
    const res = (body: unknown) => ({ ok: true, status: 200, json: async () => body });
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/entitlements/batch")) {
        return res({ results: { "autos.inventory.list": { allowed: true }, "accounting.ledger.entries": { allowed: true } } });
      }
      if (url.includes("inventario-por-unidad")) return res(INVENTARIO);
      if (url.includes("costos-por-vehiculo-tipo-mes")) {
        return res({
          moneda: "DOP", total: 1000, totales_por_moneda: [{ currency: "DOP", total: 1000 }],
          filas: [
            { vehicle_id: UUID, cost_type: "purchase", mes: "2026-09", currency: "DOP", total: 900 },
            { vehicle_id: UUID_HUERFANO, cost_type: "repair", mes: "2026-09", currency: "DOP", total: 100 },
          ],
        });
      }
      return { ok: false, status: 404, json: async () => ({}) };
    }) as unknown as typeof fetch;
  });

  it("pinta marca/modelo/anio/stock, enlaza a la ficha y no deja ningun UUID visible", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(<QueryClientProvider client={client}><AnalisisCostosPage /></QueryClientProvider>);
    await screen.findByTestId("analisis-costos");
    await waitFor(() => expect(document.body.textContent).toContain("Toyota Hilux 2021 · S-001"));
    expect(document.body.textContent).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    const filas = screen.getAllByTestId("costos-vehiculo");
    expect(filas).toHaveLength(2);
    expect(filas[0].querySelector("a")?.getAttribute("href")).toBe(`/autos/dealer/inventario/${UUID}`);
  });
});
