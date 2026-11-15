/**
 * @jest-environment jsdom
 *
 * F4E-2 (Vercel Security Review, "analyses reuse privileged data across same-tenant logins"):
 * la cache de AnalisisMarco (costos y gastos) lleva tenant Y usuario. La segunda identidad
 * del mismo tenant no recibe las cifras de la primera desde la cache.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
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

const jwt = (sub: string) => {
  const b64 = (o: object) => btoa(JSON.stringify(o)).replace(/=+$/, "");
  return `${b64({ alg: "none" })}.${b64({ sub, exp: 4102444800 })}.x`;
};
const res = (body: unknown) => ({ ok: true, status: 200, json: async () => body });

describe("AnalisisMarco: la cache lleva tenant y usuario", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
    window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
    setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
  });

  it("la segunda identidad del mismo tenant no ve las cifras cacheadas de la primera", async () => {
    let costosColgado = false;
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url.includes("/entitlements/batch")) {
        return res({ results: { "autos.inventory.list": { allowed: true }, "accounting.ledger.entries": { allowed: true } } });
      }
      if (url.includes("inventario-por-unidad")) return new Promise(() => {});
      if (url.includes("costos-por-vehiculo-tipo-mes")) {
        if (costosColgado) return new Promise(() => {});
        return res({ moneda: "DOP", total: 7777, totales_por_moneda: [{ currency: "DOP", total: 7777 }], filas: [{ vehicle_id: "v1", cost_type: "purchase", mes: "2026-09", currency: "DOP", total: 7777 }] });
      }
      return { ok: false, status: 404, json: async () => ({}) };
    }) as unknown as typeof fetch;

    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const montar = () => render(<QueryClientProvider client={client}><AnalisisCostosPage /></QueryClientProvider>);

    tokenStorage.setTokens({ accessToken: jwt("usuario-con-permiso"), refreshToken: "r" });
    const primera = montar();
    await screen.findByTestId("analisis-costos");
    primera.unmount();

    costosColgado = true;
    tokenStorage.setTokens({ accessToken: jwt("otro-usuario"), refreshToken: "r" });
    montar();
    await new Promise((r) => setTimeout(r, 80));
    expect(screen.queryByTestId("analisis-costos")).toBeNull();
  });
});
