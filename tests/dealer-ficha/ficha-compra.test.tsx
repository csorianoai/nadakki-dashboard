/**
 * @jest-environment jsdom
 *
 * F4D-4: la ficha interna pinta la compra real (GET /api/v1/autos/vehicles/{id}/purchase)
 * (PARTE 1/2: el vendedor como contacto va en la PARTE 2/2).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import DealerVehicleEconomicsPage from "@/app/autos/dealer/inventario/[vehicleId]/page";
import { tokenStorage } from "@/lib/auth/token-storage";
import { resetDealerAccessMemoryForTests, setDealerAccessContext } from "@/lib/dealer/access-context";

jest.mock("next/navigation", () => ({ useParams: () => ({ vehicleId: "veh-1" }) }));
jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

const COMPRA = {
  vehicle_id: "veh-1",
  cost: "18500000.00",
  currency: "USD",
  acquisition: {
    mode: "compra_directa",
    acquired_on: "2026-11-01",
    country_code: "AR",
    supplier_reference: null,
    fx: { rate: "1200.500000", source: "acordado", detail: "Con el vendedor", as_of: "2026-11-01T00:00:00Z" },
  },
  payments: [
    { method: "efectivo", amount: "10000000.00" },
    { method: "cheque", amount: "8500000.00", check_number: "00012345", check_bank: "Banco Nación", check_cash_date: "2026-12-15" },
  ],
};

type Opts = { costsView?: boolean; purchase?: { status: number; body: unknown } };

function mockRed(opts: Opts = {}) {
  const costsView = opts.costsView ?? true;
  const purchase = opts.purchase ?? { status: 200, body: COMPRA };
  const res = (r: { status: number; body: unknown }) => ({ ok: r.status < 300, status: r.status, json: async () => r.body });
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/v1/access/entitlements/batch")) {
      const results: Record<string, unknown> = {};
      for (const k of ["autos.inventory.list", "autos.inventory.photos"]) results[k] = { allowed: true, reason_code: "ALLOWED" };
      results["autos.costs.view"] = { allowed: costsView, reason_code: costsView ? "ALLOWED" : "DEFAULT_DENY" };
      return res({ status: 200, body: { results } });
    }
    if (url.includes("/vehicles/veh-1/purchase")) return res(purchase);
    if (url.includes("/api/v1/autos/dealers/dealer-a/vehicles/veh-1")) {
      return res({ status: 200, body: { id: "veh-1", dealer_id: "dealer-a", make: "Toyota", model: "Hilux", year: 2021, status: "disponible" } });
    }
    if (url.includes("/margin")) return res({ status: 200, body: [] });
    if (url.includes("/days")) return res({ status: 200, body: { acquired_at: "2026-11-01T00:00:00Z", days_in_inventory: 12 } });
    return res({ status: 404, body: { detail: "not-mocked" } });
  }) as unknown as typeof fetch;
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  render(<DealerVehicleEconomicsPage />, { wrapper: Wrapper });
}

const urls = () => (global.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));

beforeEach(() => {
  window.localStorage.clear();
  resetDealerAccessMemoryForTests();
  tokenStorage.clearTokens();
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
});

test("con la compra se pintan costo, moneda, 2 lineas de pago, cheque, tipo de cambio y modo", async () => {
  mockRed();
  montar();
  const det = await screen.findByTestId("ficha-compra-detalle");
  await waitFor(() => expect(screen.getByTestId("compra-costo")).toHaveTextContent(/18\.500\.000/));
  expect(screen.getByTestId("compra-costo")).toHaveTextContent("USD");
  const lineas = screen.getAllByTestId("compra-pago");
  expect(lineas).toHaveLength(2);
  expect(lineas[0]).toHaveTextContent(/Efectivo/);
  expect(lineas[1]).toHaveTextContent(/Cheque/);
  expect(lineas[1]).toHaveTextContent("00012345");
  expect(lineas[1]).toHaveTextContent("Banco Nación");
  expect(lineas[1]).toHaveTextContent("15/12/2026");
  expect(screen.getByTestId("compra-pagos-estado")).toHaveTextContent(/2 de 2|pagos/i);
  expect(screen.getByTestId("compra-fx")).toHaveTextContent("1200,5");
  expect(screen.getByTestId("compra-fx")).toHaveTextContent(/Acordado/);
  expect(screen.getByTestId("compra-fx")).toHaveTextContent("Con el vendedor");
  expect(det).toHaveTextContent(/compra_directa|Compra directa/);
});

test("con 403 en la compra la seccion no esta en el DOM (ni vacia ni con aviso)", async () => {
  mockRed({ purchase: { status: 403, body: { detail: { reason_code: "CAPABILITY_DENIED" } } } });
  montar();
  await screen.findByTestId("dealer-vehicle-ready");
  await waitFor(() => expect(urls().some((u) => u.includes("/vehicles/veh-1/purchase"))).toBe(true));
  await new Promise((r) => setTimeout(r, 50));
  expect(screen.queryByTestId("ficha-compra-detalle")).not.toBeInTheDocument();
  expect(screen.queryByTestId("compra-error")).not.toBeInTheDocument();
  expect(screen.queryByTestId("compra-sin-registro")).not.toBeInTheDocument();
});

test("sin autos.costs.view no se pide ni se pinta la compra", async () => {
  mockRed({ costsView: false });
  montar();
  await screen.findByTestId("dealer-vehicle-ready");
  await new Promise((r) => setTimeout(r, 50));
  expect(screen.queryByTestId("ficha-compra-detalle")).not.toBeInTheDocument();
  expect(urls().some((u) => u.includes("/purchase"))).toBe(false);
});

test("sin compra registrada: 'Sin compra registrada' con enlace a Adquisicion y sin cifras", async () => {
  mockRed({ purchase: { status: 404, body: { detail: { reason_code: "PURCHASE_NOT_FOUND" } } } });
  montar();
  const s = await screen.findByTestId("compra-sin-registro");
  expect(s).toHaveTextContent("Sin compra registrada");
  expect(screen.getByTestId("dealer-vehicle-adquisicion")).toHaveAttribute("href", "/autos/dealer/inventario/veh-1/registrar");
  expect(screen.queryByTestId("compra-costo")).not.toBeInTheDocument();
  expect(screen.queryByTestId("compra-pago")).not.toBeInTheDocument();
});

test("el numero de motor solo aparece si la respuesta lo trae", async () => {
  mockRed();
  montar();
  await screen.findByTestId("compra-costo");
  expect(screen.queryByTestId("compra-motor")).not.toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/Número de motor/);
});

test("con engine_number en la respuesta se pinta", async () => {
  mockRed({ purchase: { status: 200, body: { ...COMPRA, engine_number: "ABC123XYZ" } } });
  montar();
  expect(await screen.findByTestId("compra-motor")).toHaveTextContent("ABC123XYZ");
});

test("error 500 en la compra: mensaje con reintento que vuelve a pedir", async () => {
  mockRed({ purchase: { status: 500, body: { detail: "boom" } } });
  montar();
  const err = await screen.findByTestId("compra-error");
  expect(err).toBeInTheDocument();
  const antes = urls().filter((u) => u.includes("/purchase")).length;
  fireEvent.click(screen.getByRole("button", { name: /Reintentar/ }));
  await waitFor(() => expect(urls().filter((u) => u.includes("/purchase")).length).toBeGreaterThan(antes));
});

test("mientras carga se muestra el estado de carga", async () => {
  mockRed();
  montar();
  expect(await screen.findByTestId("compra-cargando")).toBeInTheDocument();
});
