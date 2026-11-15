/**
 * @jest-environment jsdom
 *
 * F4E-2 (diagnose, Vercel Security Review): con el acceso denegado o sin contexto,
 * Analisis de costos NO debe pedir inventario-por-unidad (reporte financiero completo).
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

const pedidas = () => (global.fetch as jest.Mock).mock.calls.map((c) => String(c[0]));
const montar = () => {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}><AnalisisCostosPage /></QueryClientProvider>);
};

describe("Analisis de costos: el inventario solo se pide con acceso concedido", () => {
  beforeEach(() => {
    window.localStorage.clear();
    resetDealerAccessMemoryForTests();
    tokenStorage.clearTokens();
  });

  it("con el batch denegando el acceso no se pide inventario-por-unidad ni costos", async () => {
    window.localStorage.setItem("nadakki_tenant_id", "tenant-a");
    setDealerAccessContext({ tenantId: "tenant-a", dealerId: "dealer-a", organizationUnitId: "ou-a" });
    global.fetch = jest.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes("/entitlements/batch")) {
        return { ok: true, status: 200, json: async () => ({ results: { "autos.inventory.list": { allowed: false }, "accounting.ledger.entries": { allowed: false } } }) };
      }
      return { ok: true, status: 200, json: async () => ({ moneda: "DOP", total: 1, filas: [] }) };
    }) as unknown as typeof fetch;
    montar();
    await screen.findByTestId("analisis-bloqueado");
    await new Promise((r) => setTimeout(r, 50));
    expect(pedidas().filter((u) => u.includes("inventario-por-unidad"))).toEqual([]);
    expect(pedidas().filter((u) => u.includes("costos-por-vehiculo-tipo-mes"))).toEqual([]);
  });

  it("sin contexto de dealer no se pide nada de inventario", async () => {
    global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ results: {} }) })) as unknown as typeof fetch;
    montar();
    await screen.findByTestId("analisis-sin-contexto");
    await waitFor(() => expect(true).toBe(true));
    await new Promise((r) => setTimeout(r, 50));
    expect(pedidas().filter((u) => u.includes("inventario-por-unidad"))).toEqual([]);
  });
});
