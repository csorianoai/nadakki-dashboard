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
  it("al cambiar de tenant descarta las metricas anteriores mientras carga y si el nuevo tenant esta vacio", async () => {
    pedir.mockImplementation(() => ok(resumen()));
    const vista = montar();
    expect(await screen.findByTestId("secundaria-roas")).toHaveTextContent(/3([,.]00)?/);
    mockTenant = { id: "t2", display_name: "Dealer Dos" };
    pedir.mockImplementation(() => ok(resumen({
      accounts: [{ customer_id: "9988776655", label: "998***655", currency: "DOP" }],
      as_of: null,
      kpis: null,
      series: null,
      previous_series: null,
      campaigns: null,
      coverage: { days_in_period: 30, days_with_data: 0, tables_present: false },
    })));
    vista.actualizarTenant();
    expect(await screen.findByTestId("estado-vacio-command-center")).toBeInTheDocument();
    expect(screen.getByTestId("secundaria-roas")).toHaveTextContent("Sin datos");
    expect(screen.queryByText("Dealer Uno")).toBeNull();
    expect(screen.getByText("Dealer Dos")).toBeInTheDocument();
    expect(screen.queryByText(/Dato al 10 de noviembre de 2026/)).toBeNull();
    expect(screen.queryAllByTestId("kpi-valor")).toHaveLength(0);
  });
  it("datos reales: sin banner DEMO y con el tenant", async () => {
    pedir.mockImplementation(() => ok(resumen()));
    montar();
    await waitFor(() => expect(screen.getByRole("group", { name: "Inversión" })).toBeInTheDocument());
    expect(screen.queryByTestId("banner-demo")).toBeNull();
    expect(screen.getByTestId("secundaria-roas")).not.toHaveTextContent("Sin datos");
    expect(screen.getByTestId("secundaria-roas")).toHaveTextContent(/3([,.]00)?/);
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
    expect(screen.queryByTestId("estado-vacio-command-center")).toBeNull();
    expect(screen.getByText("No se pudieron cargar los datos")).toBeInTheDocument();
  });
  it("sin tablas => conserva indicadores y graficos vacios, sin cifras inventadas ni banner DEMO", async () => {
    pedir.mockImplementation(() => ok(resumen({ kpis: null, coverage: { days_in_period: 30, days_with_data: 0, tables_present: false } })));
    montar();
    expect(await screen.findByTestId("estado-vacio-command-center")).toHaveTextContent("Sin datos en este periodo");
    for (const etiqueta of ["Inversión", "CPA", "Leads (conversiones)"]) {
      expect(screen.getByRole("group", { name: etiqueta })).toHaveTextContent("Sin datos en este periodo");
    }
    expect(screen.getByTestId("secundaria-roas")).toHaveTextContent("Sin datos");
    expect(screen.getByTestId("semaforo")).toHaveTextContent(/Pendiente de integración/);
    expect(screen.getAllByText(/Inversión diaria/).length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: "Campañas" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Calidad de los datos" })).toBeInTheDocument();
    expect(screen.getByText("Estado de conexión Google Ads")).toBeInTheDocument();
    expect(screen.getByText("Conectada · sin datos del periodo")).toBeInTheDocument();
    expect(screen.getByText("Última sincronización")).toBeInTheDocument();
    expect(screen.getByText("Dato al 2026-11-10T08:00:00Z")).toBeInTheDocument();
    expect(screen.getByText("SIMULADO: no es presupuesto real")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Secciones de Marketing Intelligence" }).querySelectorAll("li")).toHaveLength(5);
    expect(screen.queryAllByTestId("kpi-valor")).toHaveLength(0);
    expect(screen.queryByTestId("banner-demo")).toBeNull();
    expect(screen.queryByTestId("aviso-permiso")).toBeNull();
  });
});
