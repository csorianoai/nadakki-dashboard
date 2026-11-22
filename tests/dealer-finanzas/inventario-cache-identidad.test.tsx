/**
 * @jest-environment jsdom
 *
 * F4E-2 (Vercel Security Review): la cache de los nombres de unidad no se reutiliza entre
 * dos usuarios del mismo tenant. La segunda identidad no ve datos de la primera.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import AnalisisCostosPage from "@/app/autos/dealer/finanzas/analisis-costos/page";
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

const UUID = "3f2b8a52-1111-4222-8333-444455556666";
const jwt = (sub: string) => {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "");
  return `${b64({ alg: "none" })}.${b64({ sub, exp: 4102444800 })}.x`;
};
const res = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

describe("Analisis de costos: la cache de nombres lleva tenant y usuario", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
    setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
  });

  it("la segunda identidad del mismo tenant no recibe los nombres de la primera", async () => {
    let inventarioColgado = false;
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/entitlements/batch")) {
        return res({ results: { "autos.inventory.list": { allowed: true }, "accounting.ledger.entries": { allowed: true } } });
      }
      if (url.includes("inventario-por-unidad")) {
        if (inventarioColgado) return new Promise(() => {});
        return res({
          moneda: "DOP", total: 1, totales_por_moneda: [{ currency: "DOP", total: 1 }],
          filas: [{ vehicle_id: UUID, stock_number: "S-001", make: "Toyota", model: "Hilux", year: 2021, status: "available", acquired_at: "2026-01-01T00:00:00Z", dias_en_stock: 3, costos: [] }],
        });
      }
      if (url.includes("costos-por-vehiculo-tipo-mes")) {
        return res({ moneda: "DOP", total: 10, totales_por_moneda: [{ currency: "DOP", total: 10 }], filas: [{ vehicle_id: UUID, cost_type: "purchase", mes: "2026-09", currency: "DOP", total: 10 }] });
      }
      return { ok: false, status: 404, json: async () => ({}) };
    }) as unknown as typeof fetch;

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const montar = () => render(<QueryClientProvider client={client}><AnalisisCostosPage /></QueryClientProvider>);

    tokenStorage.setTokens({ accessToken: jwt("usuario-con-permiso"), refreshToken: "r" });
    const primera = montar();
    await waitFor(() => expect(document.body.textContent).toContain("Toyota Hilux 2021 · S-001"));
    primera.unmount();

    inventarioColgado = true;
    tokenStorage.setTokens({ accessToken: jwt("otro-usuario"), refreshToken: "r" });
    montar();
    await screen.findByTestId("analisis-costos");
    await new Promise((r) => setTimeout(r, 80));
    expect(document.body.textContent).not.toContain("Toyota Hilux 2021 · S-001");
  });
});
