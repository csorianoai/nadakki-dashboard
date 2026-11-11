import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { resumen } from "./fixtures-real";

jest.mock("next/dynamic", () => ({ __esModule: true, default: () => require("../CommandCenterEjecutivo").CommandCenterEjecutivo }));
jest.mock("@/lib/hooks/useTenantBranding", () => ({ useTenantBranding: () => ({ data: { locale: "es-DO" } }) }));
let mockTenant = { id: "t1", display_name: "Dealer Uno" };
jest.mock("@/hooks/useAuth", () => ({ useAuth: () => ({ tenant: mockTenant }) }));
// Se simula la red (apiFetch), no el hook: asi se prueba tambien la traduccion de errores HTTP.
const pedir = jest.fn();
jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: (...a: unknown[]) => pedir(...a) }));
const ok = (body: unknown) => Promise.resolve({ ok: true, status: 200, json: async () => body } as Response);
const falla = (status: number, detail?: string) => Promise.resolve({ ok: false, status, json: async () => ({ detail }) } as Response);

import { PantallaReal } from "../PantallaReal";

function montar() {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const vista = () => <QueryClientProvider client={qc}><PantallaReal ahora="2026-11-10T12:00:00Z" /></QueryClientProvider>;
  const resultado = render(vista());
  return { ...resultado, actualizarTenant: () => resultado.rerender(vista()) };
}

beforeEach(() => {
  pedir.mockReset();
  mockTenant = { id: "t1", display_name: "Dealer Uno" };
});

describe("PantallaReal", () => {
  it("al cambiar de tenant resetea customer_id antes de pedir su resumen", async () => {
    pedir.mockImplementation(() => ok(resumen({ accounts: [
      { customer_id: "1", label: "Cuenta uno", currency: "USD" },
      { customer_id: "2", label: "Cuenta dos", currency: "USD" },
    ] })));
    const vista = montar();
    fireEvent.change(await screen.findByTestId("selector-cuenta"), { target: { value: "2" } });
    await waitFor(() => expect(pedir.mock.calls.some(([url]) => url.includes("customer_id=2"))).toBe(true));
    await waitFor(() => expect(screen.getByTestId("selector-cuenta")).toHaveValue("2"));
    pedir.mockClear();
    mockTenant = { id: "t2", display_name: "Dealer Dos" };
    vista.actualizarTenant();
    await waitFor(() => expect(pedir).toHaveBeenCalled());
    expect(pedir.mock.calls.every(([url]) => !new URL(url, "http://localhost").searchParams.has("customer_id"))).toBe(true);
    await waitFor(() => expect(screen.getByTestId("selector-cuenta")).toHaveValue(""));
    // Volver al tenant anterior tampoco recupera su antigua seleccion.
    mockTenant = { id: "t1", display_name: "Dealer Uno" };
    vista.actualizarTenant();
    await waitFor(() => expect(screen.getByTestId("selector-cuenta")).toHaveValue(""));
  });
  it("datos reales: sin banner DEMO y con el tenant", async () => {
    pedir.mockImplementation(() => ok(resumen()));
    montar();
    await waitFor(() => expect(screen.getByRole("group", { name: "Inversión" })).toBeInTheDocument());
    expect(screen.queryByTestId("banner-demo")).toBeNull();
    expect(screen.getByText("Dealer Uno")).toBeInTheDocument();
    expect(pedir.mock.calls[0][0]).toContain("from=2026-10-12&to=2026-11-10");
  });
  it("moneda no confirmada => aviso visible", async () => {
    pedir.mockImplementation(() => ok(resumen({ currency: { code: null, source: null, confirmed: false } })));
    montar();
    expect(await screen.findByTestId("aviso-moneda")).toHaveTextContent("Moneda no confirmada");
  });
  it("403 => sin permiso; 401 => sesion caducada", async () => {
    pedir.mockImplementation(() => falla(403, "insufficient_role"));
    const a = montar();
    expect(await screen.findByTestId("aviso-permiso")).toBeInTheDocument();
    a.unmount();
    pedir.mockImplementation(() => falla(401));
    montar();
    expect(await screen.findByTestId("aviso-sesion")).toBeInTheDocument();
  });
  it("monedas distintas => seleccion de cuenta obligatoria y sin cifras", async () => {
    pedir.mockImplementation(() => ok(
      resumen({ requires_account_selection: true, kpis: null, series: null, campaigns: null, accounts: [{ customer_id: "1", label: "1**", currency: "USD" }, { customer_id: "2", label: "2**", currency: "DOP" }] }),
    ));
    montar();
    expect(await screen.findByTestId("aviso-elegir-cuenta")).toBeInTheDocument();
    expect(screen.getByTestId("selector-cuenta")).toBeRequired();
    expect(screen.queryByRole("group", { name: "Inversión" })).toBeNull();
  });
  it("5xx => estado de error con reintento", async () => {
    pedir.mockImplementation(() => falla(502));
    montar();
    expect(await screen.findByRole("alert", {}, { timeout: 4000 })).toBeInTheDocument(); // un reintento (retryDelay 1 s) antes de mostrar el error
  });
  it("sin tablas => estado vacio, no error", async () => {
    pedir.mockImplementation(() => ok(resumen({ kpis: null, coverage: { days_in_period: 30, days_with_data: 0, tables_present: false } })));
    montar();
    await waitFor(() => expect(screen.queryByRole("group", { name: "Inversión" })).toBeNull());
    expect(screen.queryByTestId("aviso-permiso")).toBeNull();
  });
});
