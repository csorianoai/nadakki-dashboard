/**
 * @jest-environment jsdom
 *
 * F4C-6 (3.2 de backend#2548): ficha interna con compra y roles.
 * F-21 (sin unidad organizativa), F-23 (fecha un dia corrida en GMT-3), F-24 (/registrar huerfana).
 * La zona horaria del test la fija el script RESULT_F4C-6.sh (TZ=America/Argentina/Buenos_Aires).
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import DealerVehicleEconomicsPage from "@/app/autos/dealer/inventario/[vehicleId]/page";
import { fechaSinZona } from "@/app/autos/dealer/inventario/[vehicleId]/ficha-interna";
import { tokenStorage } from "@/lib/auth/token-storage";
import { resetDealerAccessMemoryForTests, setDealerAccessContext } from "@/lib/dealer/access-context";

jest.mock("next/navigation", () => ({ useParams: () => ({ vehicleId: "veh-1" }) }));
jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

const COSTS_VIEW = "autos.costs.view";

function json(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body };
}

function mockRed(opts: { costsView: boolean }) {
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/v1/access/entitlements/batch")) {
      const results: Record<string, unknown> = {};
      for (const key of ["autos.inventory.list", "autos.inventory.create", "autos.inventory.photos"]) {
        results[key] = { allowed: true, reason_code: "ALLOWED", limit: null, current_usage: null };
      }
      results[COSTS_VIEW] = {
        allowed: opts.costsView,
        reason_code: opts.costsView ? "ALLOWED" : "DEFAULT_DENY",
        limit: null,
        current_usage: null,
      };
      return json({ results });
    }
    if (url.includes("/api/v1/autos/dealers/dealer-a/vehicles/veh-1")) {
      return json({ id: "veh-1", dealer_id: "dealer-a", make: "Toyota", model: "Hilux", year: 2021, status: "disponible" });
    }
    if (url.includes("/margin")) {
      return json([{ currency: "ARS", sale_price_amount: "1000", total_cost: "700", margin: "300" }]);
    }
    if (url.includes("/days")) return json({ acquired_at: "2026-11-01T00:00:00Z", days_in_inventory: 12 });
    return json({ detail: "not-mocked" }, 404);
  }) as unknown as typeof fetch;
}

function montar() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  render(<DealerVehicleEconomicsPage />, { wrapper: Wrapper });
}

function seed(organizationUnitId: string | null) {
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId });
}

const urls = () => (global.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));

beforeEach(() => {
  window.localStorage.clear();
  resetDealerAccessMemoryForTests();
  tokenStorage.clearTokens();
  seed("ou-a");
});

test("sin autos.costs.view no hay costos ni margen en el DOM ni se piden", async () => {
  mockRed({ costsView: false });
  montar();
  expect(await screen.findByTestId("dealer-vehicle-ready")).toBeInTheDocument();
  expect(await screen.findByTestId("ficha-compra")).toBeInTheDocument();
  expect(screen.queryByTestId("ficha-costos")).not.toBeInTheDocument();
  expect(screen.queryByTestId("dealer-economics-ready")).not.toBeInTheDocument();
  expect(document.body.textContent).not.toMatch(/margen|costo|coste/i);
  expect(screen.queryByTestId("ficha-numero-motor")).not.toBeInTheDocument();
  expect(urls().some((u) => u.includes("/margin"))).toBe(false);
});

test("con autos.costs.view se pinta costo y margen", async () => {
  mockRed({ costsView: true });
  montar();
  expect(await screen.findByTestId("ficha-costos")).toBeInTheDocument();
  expect(await screen.findByText(/margen 300/)).toBeInTheDocument();
});

test("F-23: la fecha de adquisicion 01/11 se muestra 01/11 (sin correr un dia)", async () => {
  mockRed({ costsView: false });
  montar();
  expect(await screen.findByTestId("ficha-fecha-adquisicion")).toHaveTextContent("01/11/2026");
});

test("fechaSinZona usa la fecha del texto y no la zona del navegador", () => {
  expect(fechaSinZona("2026-11-01T00:00:00Z")).toBe("01/11/2026");
  expect(fechaSinZona("2026-11-01T00:00:00")).toBe("01/11/2026");
  expect(fechaSinZona("2026-11-01")).toBe("01/11/2026");
  expect(fechaSinZona("no es fecha")).toBeNull();
  expect(fechaSinZona(null)).toBeNull();
});

test("F-24: la ficha enlaza a la pantalla de Adquisicion", async () => {
  mockRed({ costsView: false });
  montar();
  const link = await screen.findByTestId("dealer-vehicle-adquisicion");
  expect(link).toHaveAttribute("href", "/autos/dealer/inventario/veh-1/registrar");
});

test("F-21: sin unidad organizativa la ficha se abre, sin 'No se pudo identificar tu concesionario'", async () => {
  window.localStorage.clear();
  resetDealerAccessMemoryForTests();
  seed(null);
  mockRed({ costsView: false });
  montar();
  expect(await screen.findByTestId("dealer-vehicle-ready")).toBeInTheDocument();
  expect(screen.queryByText(/No se pudo identificar tu concesionario/)).not.toBeInTheDocument();
});

test("controles sin endpoint quedan deshabilitados con 'Disponible cuando ...'", async () => {
  mockRed({ costsView: false });
  montar();
  const edicion = await screen.findByTestId("ficha-editar-tecnicos");
  expect(edicion).toBeDisabled();
  expect(screen.getByTestId("ficha-editar-tecnicos-motivo")).toHaveTextContent(/^Disponible cuando /);
  expect(screen.getByTestId("ficha-vendedor-motivo")).toHaveTextContent(/^Disponible cuando /);
});
