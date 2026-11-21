import React from "react";
import { render, screen, waitFor, within } from "@testing-library/react";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("@/contexts/TenantContext", () => ({ useTenant: () => ({ tenantId: mockTenant.id }) }));
import { apiFetch } from "@/lib/api/fetch-client";
import { PanelMarketing } from "@/components/sites/resumen/marketing/PanelMarketing";
import { cargarContactos } from "@/lib/sites/marketing";
import { resp, SITE_A, TENANT } from "../fake";

const mockTenant: { id: string | null } = { id: TENANT };
const f = apiFetch as jest.Mock;
const AHORA = Date.parse("2026-11-21T12:00:00Z");
const hace = (dias: number) => new Date(AHORA - dias * 86_400_000).toISOString();
const lead = (dias: number, i: number) => ({ id: `l${i}`, created_at: hace(dias) });

let readiness: () => Response;
let accounts: () => Response;
let metrics: () => Response;
let leads: (url: string) => Response;

beforeEach(() => {
  jest.useFakeTimers({ now: AHORA, doNotFake: ["setTimeout", "setInterval", "nextTick", "queueMicrotask", "setImmediate"] });
  f.mockReset();
  mockTenant.id = TENANT;
  readiness = () => resp({ tenant_id: TENANT, overall_status: "ready", api_connected: true });
  accounts = () => resp({ data: { accounts: [{ customer_id: "1234567890", readable: true, manager: false, currency_code: "USD" }] } });
  metrics = () => resp({ data: { campaigns: [
    { id: "1", clicks: 40, impressions: 1000, cost_micros: 12_500_000, conversions: 3 },
    { id: "2", clicks: 2, impressions: 77, cost_micros: 500_000, conversions: 1 },
  ] } });
  leads = () => resp({ items: [lead(1, 1), lead(10, 2), lead(45, 3)], next_cursor: null });
  (global as unknown as { fetch: jest.Mock }).fetch = jest.fn(async (url: string) => {
    if (String(url).endsWith("/google-ads/readiness")) return readiness();
    throw new Error(`fetch inesperado ${url}`);
  });
  f.mockImplementation(async (url: string) => {
    const u = String(url);
    if (u.includes("/leads")) return leads(u);
    if (u.endsWith("/google-ads/accounts")) return accounts();
    if (u.includes("/google-ads/metrics")) return metrics();
    throw new Error(`url inesperada ${url}`);
  });
});
afterEach(() => jest.useRealTimers());

const pintar = (demo = false) => render(<PanelMarketing siteId={SITE_A} lang="es" demo={demo} />);

test("conectado: muestra las cifras del mock (contactos y totales de Ads)", async () => {
  pintar();
  expect(await screen.findByTestId("mkt-contactos-total")).toHaveTextContent("3");
  expect(screen.getByTestId("mkt-contactos-7")).toHaveTextContent("1");
  expect(screen.getByTestId("mkt-contactos-30")).toHaveTextContent("2");
  expect(await screen.findByTestId("mkt-ads-clics")).toHaveTextContent("42");
  expect(screen.getByTestId("mkt-ads-impresiones")).toHaveTextContent(/1[.,]?077/);
  expect(screen.getByTestId("mkt-ads-conversiones")).toHaveTextContent("4");
  expect(screen.getByTestId("mkt-ads-gasto")).toHaveTextContent("13");
  const q = f.mock.calls.map((c) => String(c[0])).find((u) => u.includes("/metrics"))!;
  expect(q).toContain(`/tenants/${TENANT}/`);
  expect(q).toContain("date_range=LAST_30_DAYS");
});

test("no conectado: tarjeta de conectar que enlaza a la pantalla de conexiones, sin llamar a métricas", async () => {
  readiness = () => resp({ tenant_id: TENANT, overall_status: "disconnected", api_connected: false });
  pintar();
  const c = await screen.findByTestId("mkt-ads-conectar");
  expect(within(c).getByRole("link")).toHaveAttribute("href", "/marketing/social-connections");
  expect(f.mock.calls.some((x) => String(x[0]).includes("/google-ads/"))).toBe(false);
});

test("el error de una fuente no afecta a la otra", async () => {
  readiness = () => resp({ detail: "caido" }, 503);
  pintar();
  expect(await screen.findByTestId("mkt-ads-error")).toBeInTheDocument();
  expect(await screen.findByTestId("mkt-contactos-total")).toHaveTextContent("3");
});

test("error de contactos no tumba Ads", async () => {
  leads = () => resp({ title: "x" }, 500, "application/problem+json");
  pintar();
  expect(await screen.findByTestId("mkt-contactos-error")).toBeInTheDocument();
  expect(await screen.findByTestId("mkt-ads-clics")).toHaveTextContent("42");
});

test("varias cuentas sin elegir: pide elegir en Google Ads y no inventa cifras", async () => {
  accounts = () => resp({ data: { accounts: [
    { customer_id: "1111111111", readable: true, manager: false }, { customer_id: "2222222222", readable: true, manager: false },
  ] } });
  pintar();
  expect(await screen.findByTestId("mkt-ads-elegir")).toBeInTheDocument();
  expect(screen.queryByTestId("mkt-ads-clics")).toBeNull();
});

test("GA4 nunca muestra números", async () => {
  pintar();
  await screen.findByTestId("mkt-contactos-total");
  const ga = screen.getByTestId("mkt-ga4");
  expect((ga.textContent ?? "").replace(/Analytics 4/g, "")).not.toMatch(/\d/);
  expect(within(ga).getByRole("link")).toHaveAttribute("href", "https://analytics.google.com/");
});

test("modo demostración: ninguna llamada y ninguna cifra", () => {
  pintar(true);
  expect(screen.getByTestId("mkt-demo")).toBeInTheDocument();
  expect(f).not.toHaveBeenCalled();
  expect(screen.getByTestId("mkt-contactos").textContent).not.toMatch(/\d/);
  expect((screen.getByTestId("mkt-ads").textContent ?? "").replace("30 días", "")).not.toMatch(/\d/);
  expect(screen.queryByTestId("mkt-ads-clics")).toBeNull();
});

test("sin tenant en la sesión no se llama a Google Ads", async () => {
  mockTenant.id = null;
  pintar();
  await screen.findByTestId("mkt-contactos-total");
  await waitFor(() => expect(screen.getByTestId("mkt-ads")).toHaveTextContent("No hay una cuenta de Nadakki"));
  expect(f.mock.calls.some((x) => String(x[0]).includes("google-ads"))).toBe(false);
});

test("cargarContactos pagina y marca incompleto pasado el tope de 1.000", async () => {
  leads = (u) => resp({ items: Array.from({ length: 100 }, (_, i) => lead(2, i)), next_cursor: `c${u.length}` });
  const r = await cargarContactos(SITE_A, AHORA);
  expect(r).toEqual({ total: 1000, d7: 1000, d30: 1000, completo: false });
  expect(f.mock.calls.filter((c) => String(c[0]).includes("/leads"))).toHaveLength(10);
});
