import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FiltrosPoolV2 } from "@/components/credit-hub/bank-v2/config/FiltrosPoolV2";
import { MetasDelMes } from "@/components/credit-hub/bank-v2/mesa/MetasDelMes";
import { marcaDesdeBranding } from "@/lib/dcc/marca";

const llamadas: Array<{ method: string; tenant: string; body?: string }> = [];
jest.mock("@/lib/credit-hub/hooks/useTenant", () => ({ useTenant: () => ({ apiTenantId: "t-1", tenantId: "t-1", loading: false }) }));
jest.mock("@/lib/api/fetch-client", () => ({
  apiFetch: jest.fn(async (path: string, init: { method: string; headers: Record<string, string>; body?: string }) => {
    llamadas.push({ method: `${init.method} ${path}`, tenant: init.headers["X-Tenant-ID"], body: init.body });
    const config = init.method === "DELETE" ? {} : { vehicle_year_min: 2020, vehicle_makes_include: ["Toyota", "Honda"] };
    return { ok: true, status: 200, text: async () => JSON.stringify({ lender_code: "BANCO_EJ_01", filter_config: config }) };
  }),
}));
jest.mock("@/lib/credit-hub/api/client", () => ({
  ...jest.requireActual("@/lib/credit-hub/api/client"),
  chFetch: jest.fn(async () => ({ period: "2026-10", goals: [{ metric_key: "approved_amount", label_es: "Monto aprobado", unit: "currency", current_value: 4_800_000, target_value: 10_000_000 }] })),
}));

const envolver = (ui: React.ReactNode) => render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>{ui}</QueryClientProvider>);

describe("Filtros de pool y Metas v2 (B6)", () => {
  beforeEach(() => (llamadas.length = 0));

  it("filtros: mismas llamadas y mismo cuerpo; quitar todo pide confirmar; sin codigos a la vista", async () => {
    const { container } = envolver(<FiltrosPoolV2 marca={marcaDesdeBranding({ locale: "es-DO", currency: "DOP" }, "banco")} />);
    expect(await screen.findByDisplayValue("Toyota, Honda")).toBeInTheDocument();
    expect(screen.getByText("Monto mínimo (DOP)")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Condición"), { target: { value: "used" } });
    fireEvent.click(screen.getByRole("button", { name: "Guardar filtros" }));
    await waitFor(() => expect(llamadas.some((l) => l.method.startsWith("PUT"))).toBe(true));
    const put = llamadas.find((l) => l.method.startsWith("PUT"))!;
    expect(JSON.parse(put.body!)).toEqual({ filter_config: { vehicle_year_min: 2020, vehicle_condition: "used", vehicle_makes_include: ["Toyota", "Honda"] } });
    fireEvent.click(await screen.findByRole("button", { name: "Restablecer pool completo" }));
    expect(llamadas.some((l) => l.method.startsWith("DELETE"))).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Sí, quitar" }));
    await waitFor(() => expect(llamadas.some((l) => l.method.startsWith("DELETE"))).toBe(true));
    expect(llamadas.map((l) => `${l.method}|${l.tenant}`)).toEqual([
      "GET /api/v2/credit/pool-filters|t-1", "PUT /api/v2/credit/pool-filters|t-1", "DELETE /api/v2/credit/pool-filters|t-1",
    ]);
    expect(container.textContent).not.toMatch(/BANCO_EJ_01|Error HTTP|new \| used/);
  });

  it("metas: misma consulta, con la moneda del branding (no RD$ fijo)", async () => {
    const { container } = envolver(<MetasDelMes formato={{ locale: "es-AR", currency: "ARS" }} ahora={new Date(2026, 9, 28)} />);
    expect(await screen.findByText("Monto aprobado")).toBeInTheDocument();
    const texto = (container.textContent ?? "").replace(/[  ]/g, " ");
    expect(texto).toContain("$ 4,8 M");
    expect(texto).not.toContain("RD$");
    expect(screen.getByText("Atrasada")).toBeInTheDocument();
  });
});
