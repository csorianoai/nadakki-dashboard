/**
 * @jest-environment jsdom
 *
 * F4E-2 PARTES 3-4/4: vista de inventario en Finanzas (filtros en URL, tabla, graficos, CSV, totales del endpoint).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import InventarioFinanzasPage from "@/app/autos/dealer/finanzas/inventario/page";
import { tokenStorage } from "@/lib/auth/token-storage";
import { resetDealerAccessMemoryForTests, setDealerAccessContext } from "@/lib/dealer/access-context";

const push = jest.fn();
let busqueda = "";
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: (u: string) => push(u), replace: (u: string) => push(u) }),
  useSearchParams: () => new URLSearchParams(busqueda),
  usePathname: () => "/autos/dealer/finanzas/inventario",
}));
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
const FILA = {
  vehicle_id: UUID, stock_number: "S-001", make: "Toyota", model: "Hilux", year: 2021, status: "disponible",
  acquired_at: "2026-09-10T00:00:00Z", dias_en_stock: 40, costos: [{ currency: "DOP", total: 900 }],
};
const BASE = { moneda: "DOP", total: 12345, totales_por_moneda: [{ currency: "DOP", total: 12345 }, { currency: "USD", total: 77 }], filas: [FILA] };
let respuesta: unknown = BASE;
let estadoInventario = 200;

const urls = () => (global.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));
const montar = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}><InventarioFinanzasPage /></QueryClientProvider>);
};

beforeEach(() => {
  push.mockClear();
  busqueda = "";
  respuesta = BASE;
  estadoInventario = 200;
  window.localStorage.clear();
  resetDealerAccessMemoryForTests();
  tokenStorage.clearTokens();
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
  (global as unknown as { URL: { createObjectURL: unknown } }).URL.createObjectURL = jest.fn(() => "blob:x");
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/entitlements/batch")) {
      return { ok: true, status: 200, json: async () => ({ results: { "autos.inventory.list": { allowed: true }, "accounting.ledger.entries": { allowed: true } } }) };
    }
    if (url.includes("formato=csv")) return { ok: true, status: 200, blob: async () => new Blob(["a,b"]) };
    if (url.includes("inventario-por-unidad")) return { ok: estadoInventario === 200, status: estadoInventario, json: async () => respuesta };
    return { ok: false, status: 404, json: async () => ({}) };
  }) as unknown as typeof fetch;
});

describe("vista de inventario", () => {
  it("aplicar el filtro marca llama al endpoint con ?marca= y lo refleja en la URL", async () => {
    montar();
    await screen.findByTestId("inv-tabla");
    fireEvent.change(screen.getByLabelText("Marca"), { target: { value: "Toyota" } });
    fireEvent.click(screen.getByRole("button", { name: "Aplicar filtros" }));
    expect(push).toHaveBeenCalledWith(expect.stringContaining("marca=Toyota"));
  });

  it("los filtros de la URL viajan al endpoint", async () => {
    busqueda = "marca=Kia&estado=vendido&adquirido_desde=2026-01-01";
    montar();
    await screen.findByTestId("inv-tabla");
    const u = urls().find((x) => x.includes("inventario-por-unidad") && !x.includes("formato"))!;
    expect(u).toContain("marca=Kia");
    expect(u).toContain("estado=vendido");
    expect(u).toContain("adquirido_desde=2026-01-01");
  });

  it("la tabla etiqueta por marca/modelo/stock, enlaza a la ficha y no muestra ningun UUID", async () => {
    montar();
    const tabla = await screen.findByTestId("inv-tabla");
    expect(tabla.textContent).toContain("Toyota Hilux 2021 · S-001");
    expect(document.body.textContent).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    expect(screen.getAllByRole("link", { name: /Toyota Hilux 2021/ })[0].getAttribute("href")).toBe(`/autos/dealer/inventario/${UUID}`);
  });

  it("sin margen en la respuesta no existe el grafico de margen; con margen si", async () => {
    const { unmount } = montar();
    await screen.findByTestId("inv-tabla");
    expect(screen.queryByLabelText("Margen esperado por unidad")).toBeNull();
    expect(screen.getByLabelText("Costo por marca")).toBeTruthy();
    expect(screen.getByLabelText("Días en stock por unidad")).toBeTruthy();
    unmount();
    respuesta = { ...BASE, filas: [{ ...FILA, precio_lista: 1500, moneda_precio: "DOP", margen_esperado: 600 }] };
    montar();
    await screen.findByTestId("inv-tabla");
    expect(screen.getByLabelText("Margen esperado por unidad")).toBeTruthy();
  });

  it("Exportar CSV pide formato=csv con los filtros activos", async () => {
    busqueda = "marca=Honda&estado=disponible";
    montar();
    await screen.findByTestId("inv-tabla");
    fireEvent.click(screen.getByRole("button", { name: "Exportar CSV" }));
    await waitFor(() => expect(urls().some((u) => u.includes("formato=csv"))).toBe(true));
    const u = urls().find((x) => x.includes("formato=csv"))!;
    expect(u).toContain("marca=Honda");
    expect(u).toContain("estado=disponible");
  });

  it("el total mostrado es el del endpoint, por moneda, sin sumar en el navegador", async () => {
    montar();
    const t = await screen.findByTestId("inv-total");
    expect(t.getAttribute("data-total")).toBe("12345");
    expect(t.getAttribute("data-moneda")).toBe("DOP");
    expect(screen.getByTestId("inv-total-USD").getAttribute("data-total")).toBe("77");
  });

  it("403 muestra mensaje de permiso y ninguna cifra", async () => {
    estadoInventario = 403;
    montar();
    await screen.findByTestId("inv-sin-permiso");
    expect(screen.queryByTestId("inv-total")).toBeNull();
    expect(screen.queryByTestId("inv-tabla")).toBeNull();
  });

  it("error generico ofrece reintento; vacio muestra mensaje", async () => {
    estadoInventario = 500;
    montar();
    await screen.findByTestId("inv-error");
    estadoInventario = 200;
    respuesta = { ...BASE, filas: [] };
    fireEvent.click(screen.getByRole("button", { name: "Reintentar" }));
    await screen.findByTestId("inv-vacio");
  });
});
