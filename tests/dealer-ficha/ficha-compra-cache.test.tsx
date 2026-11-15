/**
 * @jest-environment jsdom
 *
 * F4D-4 (hallazgo Vercel, fuga de PII): la cache de la compra
 * no se reutiliza entre identidades. Mismo QueryClient, dos usuarios, mismo vehiculo.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import DealerVehicleEconomicsPage from "@/app/autos/dealer/inventario/[vehicleId]/page";
import { tokenStorage } from "@/lib/auth/token-storage";
import { resetDealerAccessMemoryForTests, setDealerAccessContext } from "@/lib/dealer/access-context";

jest.mock("next/navigation", () => ({ useParams: () => ({ vehicleId: "veh-1" }) }));
jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: jest.fn(() => false),
}));

const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (sub: string) => `${b64({ alg: "none" })}.${b64({ sub, exp: 9999999999 })}.x`;

let colgarCompra = false;
const res = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

beforeEach(() => {
  window.localStorage.clear();
  resetDealerAccessMemoryForTests();
  tokenStorage.clearTokens();
  window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
  setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
  global.fetch = jest.fn(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/entitlements/batch")) {
      return res({ results: { "autos.costs.view": { allowed: true, reason_code: "ALLOWED" }, "autos.inventory.list": { allowed: true, reason_code: "ALLOWED" } } });
    }
    if (url.includes("/vehicles/veh-1/purchase")) {
      if (colgarCompra) return new Promise(() => {});
      return res({ vehicle_id: "veh-1", cost: { currency: "USD", amount: "111.00", paid_total: "0.00" }, acquisition: { mode: "compra_directa" }, payments: [] });
    }
    if (url.includes("/api/v1/autos/dealers/dealer-a/vehicles/veh-1")) return res({ id: "veh-1", dealer_id: "dealer-a", make: "Toyota", model: "Hilux", year: 2021, status: "disponible" });
    if (url.includes("/margin")) return res([]);
    if (url.includes("/days")) return res({ acquired_at: "2026-11-01T00:00:00Z", days_in_inventory: 1 });
    return { ok: false, status: 404, json: async () => ({}) };
  }) as unknown as typeof fetch;
});

test("el segundo usuario no recibe la compra en cache del primero", async () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const Wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  const n = (frag: string) => (global.fetch as jest.Mock).mock.calls.filter((c) => String(c[0]).includes(frag)).length;

  tokenStorage.setTokens({ accessToken: jwt("user-1"), refreshToken: "r1" });
  const a = render(<DealerVehicleEconomicsPage />, { wrapper: Wrapper });
  await waitFor(() => expect(screen.getByTestId("compra-costo")).toHaveTextContent("111"));
  a.unmount();

  tokenStorage.setTokens({ accessToken: jwt("user-2"), refreshToken: "r2" });
  // La respuesta del segundo usuario queda pendiente: nunca debe verse el dato del primero.
  colgarCompra = true;
  render(<DealerVehicleEconomicsPage />, { wrapper: Wrapper });
  await waitFor(() => expect(n("/purchase")).toBe(2));
  await screen.findByTestId("compra-cargando");
  expect(screen.queryByTestId("compra-costo")).not.toBeInTheDocument();
});
