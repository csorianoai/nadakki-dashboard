import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";

jest.mock("@/contexts/TenantContext", () => ({
  useTenant: () => ({ tenantId: "tenant-sesion" }),
}));
jest.mock("@/lib/auth/token-refresh", () => ({
  refreshAccessToken: jest.fn(async () => false),
  isTokenExpiringSoon: () => false,
}));
jest.mock("@/lib/auth/token-storage", () => ({
  tokenStorage: { getAccessToken: () => "TOKEN-DE-PRUEBA" },
}));
jest.mock("@/lib/auth/jwt-decode", () => ({
  decodeJWT: () => ({ sub: "usuario-7" }),
}));

import MetricasGoogleAds from "@/components/google-ads/MetricasGoogleAds";

const resp = (status: number, body: unknown) => ({
  ok: status >= 200 && status < 300,
  status,
  json: async () => body,
});

const cuenta = (o: Record<string, unknown>) => ({
  customer_id: "1234567890",
  name: "Cuenta Uno",
  currency_code: "USD",
  time_zone: "America/New_York",
  manager: false,
  status: "ENABLED",
  readable: true,
  ...o,
});
const accounts = (list: unknown[]) => resp(200, { success: true, data: { accounts: list, total_accessible: list.length, truncated: false } });

const camp = (id: string, name: string, impressions: number, clicks: number, cost_micros: number, conversions: number) => ({
  id, name, status: "ENABLED", impressions, clicks, cost_micros, cost: cost_micros / 1e6, conversions, conversions_value: 0,
});
const metricas = (campaigns: unknown[]) =>
  resp(200, { success: true, data: { date_range: "LAST_30_DAYS", campaigns, ad_groups: [], keywords: [], conversion_actions: [] } });

let fetchMock: jest.Mock;
const llamadas = (frag: string) => fetchMock.mock.calls.filter((c) => String(c[0]).includes(frag));
const rutear = (acc: any, met: any) =>
  fetchMock.mockImplementation(async (url: string) => {
    if (String(url).includes("/google-ads/accounts")) return acc;
    if (String(url).includes("/google-ads/metrics")) return typeof met === "function" ? met(url) : met;
    return resp(200, { connection_status: "not_connected" });
  });

beforeEach(() => {
  fetchMock = jest.fn();
  (global as any).fetch = fetchMock;
  window.localStorage.clear();
});

describe("metricas de Google Ads", () => {
  it("3 campanas: filas y totales exactos, CTR calculado, moneda de la cuenta", async () => {
    rutear(
      accounts([cuenta({})]),
      metricas([
        camp("1", "Alfa", 1000, 50, 12_500_000, 2),
        camp("2", "Beta", 2000, 30, 7_250_000, 1.5),
        camp("3", "Gamma", 0, 0, 0, 0),
      ]),
    );
    render(<MetricasGoogleAds />);
    const tabla = await screen.findByRole("table");
    const filas = within(tabla).getAllByRole("row");
    expect(filas).toHaveLength(1 + 3 + 1); // cabecera + 3 + totales
    const alfa = within(filas[1]).getAllByRole("cell").map((c) => c.textContent);
    expect(alfa[0]).toBe("Alfa");
    expect(alfa[1]).toBe("1,000");
    expect(alfa[2]).toBe("50");
    expect(alfa[3]).toBe("5.00 %");
    expect(alfa[4]).toMatch(/US\$\s?12\.50|\$\s?12\.50/);
    expect(alfa[5]).toBe("2");
    // Gamma sin impresiones: CTR no se inventa
    expect(within(filas[3]).getAllByRole("cell")[3].textContent).toBe("—");
    // Totales: 3000 impresiones, 80 clics, CTR 80/3000 = 2.67 %, costo 19.75, conversiones 3.5
    const tot = within(filas[4]).getAllByRole("cell").map((c) => c.textContent);
    expect(tot[1]).toBe("3,000");
    expect(tot[2]).toBe("80");
    expect(tot[3]).toBe("2.67 %");
    expect(tot[4]).toMatch(/19\.75/);
    expect(tot[5]).toBe("3.5");
    expect(llamadas("/metrics")).toHaveLength(1);
    const url = String(llamadas("/metrics")[0][0]);
    expect(url).toContain("/api/v1/tenants/tenant-sesion/google-ads/metrics");
    expect(url).toContain("customer_id=1234567890");
    expect(url).toContain("date_range=LAST_30_DAYS");
  });

  it("el texto no contiene cifras que no vengan del mock", async () => {
    rutear(accounts([cuenta({})]), metricas([camp("1", "Alfa", 1000, 50, 12_500_000, 2)]));
    const { container } = render(<MetricasGoogleAds />);
    await screen.findByRole("table");
    const permitidas = new Set(["1,000", "50", "5.00", "12.50", "2", "123-456-7890", "7", "14", "30"]);
    const hojas = Array.from(container.querySelectorAll("*")).filter((e) => e.children.length === 0);
    const numeros = hojas.flatMap((e) => (e.textContent ?? "").match(/\d[\d,.-]*/g) ?? []);
    for (const n of numeros) expect([n, permitidas.has(n.replace(/\.$/, ""))]).toEqual([n, true]);
  });

  it("cambiar de rango vuelve a pedir con el rango elegido", async () => {
    rutear(accounts([cuenta({})]), metricas([camp("1", "Alfa", 10, 1, 1_000_000, 0)]));
    render(<MetricasGoogleAds />);
    await screen.findByRole("table");
    fireEvent.change(screen.getByLabelText(/rango/i), { target: { value: "LAST_7_DAYS" } });
    await waitFor(() => expect(llamadas("/metrics")).toHaveLength(2));
    expect(String(llamadas("/metrics")[1][0])).toContain("date_range=LAST_7_DAYS");
  });

  it.each([
    [403, /No tienes permiso/],
    [422, /rango.*no es v/i],
    [500, /No pudimos leer/],
    [502, /No pudimos leer/],
  ])("metrics %s -> mensaje llano", async (status, texto) => {
    rutear(accounts([cuenta({})]), resp(status as number, { detail: "x" }));
    render(<MetricasGoogleAds />);
    expect(await screen.findByRole("alert")).toHaveTextContent(texto as RegExp);
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("sin filas -> Sin datos en este rango", async () => {
    rutear(accounts([cuenta({})]), metricas([]));
    render(<MetricasGoogleAds />);
    expect(await screen.findByText("Sin datos en este rango")).toBeTruthy();
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("sin conexion (409) -> invita a conectar y 0 llamadas a metrics", async () => {
    rutear(resp(409, { detail: { code: "google_not_connected" } }), metricas([]));
    render(<MetricasGoogleAds />);
    expect(await screen.findByRole("button", { name: "Conectar Google Ads" })).toBeTruthy();
    expect(llamadas("/metrics")).toHaveLength(0);
  });

  it("503 y 502 en cuentas -> mensaje llano, 0 llamadas a metrics", async () => {
    rutear(resp(503, {}), metricas([]));
    render(<MetricasGoogleAds />);
    expect(await screen.findByRole("alert")).toHaveTextContent(/No pudimos leer/);
    expect(llamadas("/metrics")).toHaveLength(0);
  });

  it("ninguna cuenta elegible (administradora o no legible) -> aviso y 0 llamadas a metrics", async () => {
    rutear(accounts([cuenta({ manager: true }), cuenta({ customer_id: "2222222222", readable: false })]), metricas([]));
    render(<MetricasGoogleAds />);
    expect(await screen.findByText("No hay cuentas de Google Ads con datos")).toBeTruthy();
    expect(llamadas("/metrics")).toHaveLength(0);
  });

  it("varias cuentas: no llama hasta elegir; lista solo elegibles con guiones; recuerda por tenant y usuario", async () => {
    rutear(
      accounts([
        cuenta({ manager: true, customer_id: "9999999999", name: "Admin" }),
        cuenta({ customer_id: "1112223334", name: "Uno", currency_code: "DOP" }),
        cuenta({ customer_id: "5556667778", name: "Dos", currency_code: "EUR" }),
      ]),
      metricas([camp("1", "Alfa", 10, 1, 2_000_000, 0)]),
    );
    render(<MetricasGoogleAds />);
    expect(await screen.findByText("Elige una cuenta de Google Ads")).toBeTruthy();
    expect(llamadas("/metrics")).toHaveLength(0);
    const sel = screen.getByLabelText(/cuenta/i) as HTMLSelectElement;
    const opts = Array.from(sel.options).map((o) => o.textContent);
    expect(opts.some((o) => /Admin|999-999-9999/.test(o ?? ""))).toBe(false);
    expect(opts).toContain("Uno · 111-222-3334");
    fireEvent.change(sel, { target: { value: "5556667778" } });
    await screen.findByRole("table");
    expect(String(llamadas("/metrics")[0][0])).toContain("customer_id=5556667778");
    // moneda de la cuenta elegida (EUR), no otra
    expect(within(screen.getByRole("table")).getAllByRole("row")[1].textContent).toMatch(/€|EUR/);
    const claves = Object.keys(window.localStorage);
    expect(claves).toHaveLength(1);
    expect(claves[0]).toContain("tenant-sesion");
    expect(claves[0]).toContain("usuario-7");
    expect(window.localStorage.getItem(claves[0])).toBe("5556667778");
  });

  it("cuenta recordada que ya no es elegible se descarta", async () => {
    window.localStorage.setItem("nadakki_gads_cuenta:tenant-sesion:usuario-7", "0000000000");
    rutear(accounts([cuenta({ customer_id: "1112223334" }), cuenta({ customer_id: "5556667778", name: "B" })]), metricas([]));
    render(<MetricasGoogleAds />);
    expect(await screen.findByText("Elige una cuenta de Google Ads")).toBeTruthy();
    expect(llamadas("/metrics")).toHaveLength(0);
  });

  it("0 llamadas reales: todo pasa por el mock de fetch y con Authorization", async () => {
    rutear(accounts([cuenta({})]), metricas([]));
    render(<MetricasGoogleAds />);
    await screen.findByText("Sin datos en este rango");
    for (const c of fetchMock.mock.calls) {
      expect(String(c[0])).toMatch(/^\/api\/v1\/tenants\/tenant-sesion\//);
      expect(new Headers(c[1]?.headers).get("Authorization")).toBe("Bearer TOKEN-DE-PRUEBA");
      expect(new Headers(c[1]?.headers).get("X-Tenant-ID")).toBeNull();
    }
  });
});
