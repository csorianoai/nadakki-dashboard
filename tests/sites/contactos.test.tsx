import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(`sitio=00000000-0000-4000-8000-0000000000b1`),
  usePathname: () => "/mi-web/contactos",
}));
import { apiFetch } from "@/lib/api/fetch-client";
import Layout from "@/app/mi-web/layout";
import ContactosPage from "@/app/mi-web/contactos/page";
import leadsSchema from "@/lib/sites/contract/leads-schema.json";
import { LEAD_REQUIRED } from "@/lib/sites/contactos/types";
import { resp, TENANT, siteOk } from "./fake";

const f = apiFetch as jest.Mock;
const problem = (status: number, code: string) => resp({ type: "x", title: "t", status, code }, status, "application/problem+json");
const consent = (channel: string, status = "granted") => ({
  consent_id: `d-${channel}`, channel, status, text_version: `consent-${channel}-2026-10`, text_locale: "es", recorded_at: "2026-11-07T15:00:00Z",
});
const lead = (id: string, extra: object = {}) => ({
  id, tenant_id: TENANT, vertical: "realestate", site_id: "00000000-0000-4000-8000-0000000000b1", idempotency_key: "synth-idem-0000001",
  name: `Visitante ${id}`, email: `${id}@synth.invalid`, message: `Mensaje de ${id}`, locale: "es", source_page: `/es/propiedades/${id}`,
  consents: [consent("email"), consent("whatsapp", "denied")], contactable_channels: ["email"], status: "projected", created_at: "2026-11-07T15:00:00Z", ...extra,
});
const GCLID = "SYNTHgclid-123";
const L1 = lead("c1", { ad_click: { click_consent: "granted", gclid: GCLID } });
const L2 = lead("c2", { ad_click: { click_consent: "denied" } });
type H = Record<string, () => Response>;
function route(h: H) {
  f.mockImplementation(async (url: string, init?: { method?: string }) => {
    const u = url.split("?")[0];
    if (u.endsWith("/api/v1/sites/sites")) return resp({ items: [siteOk], next_cursor: null });
    const key = `${init?.method ?? "GET"} ${u.replace(/^.*\/sites\/[^/]+/, "")}`;
    const fn = h[key];
    if (!fn) throw new Error(`url inesperada ${key}`);
    return fn();
  });
}
const App = () => (<Layout><ContactosPage /></Layout>);
const ENV = ["NEXT_PUBLIC_SITES_PANEL", "NEXT_PUBLIC_SITES_ALLOW_DEMO"] as const;
const LISTA = () => resp({ items: [L1, L2], next_cursor: null });

beforeEach(() => {
  f.mockReset();
  for (const k of ENV) delete process.env[k];
  process.env.NEXT_PUBLIC_SITES_PANEL = "1";
});
afterAll(() => { for (const k of ENV) delete process.env[k]; });

describe("Mi web / Contactos: lista", () => {
  test("lista tipada: nombre, canal vigente, estado, fecha, pagina; nunca ids de clic; sin datos personales en URL", async () => {
    route({ "GET /leads": LISTA });
    render(<App />);
    const r1 = await screen.findByTestId("contacto-c1");
    expect(r1.textContent).toContain("Visitante c1");
    expect(within(r1).getByTestId("canales-c1").textContent).toMatch(/correo|email/i);
    expect(within(r1).getByTestId("canales-c1").textContent).not.toMatch(/whatsapp/i);
    expect(r1.textContent).toContain("2026-11-07");
    expect(r1.textContent).toContain("/es/propiedades/c1");
    expect(screen.getByTestId("estado-c1").textContent).toMatch(/proyectado/i);
    expect(document.body.textContent).not.toContain(GCLID);
    for (const c of f.mock.calls) expect(String(c[0])).not.toMatch(/synth\.invalid|Visitante|tenant/i);
    expect(JSON.stringify(f.mock.calls)).not.toMatch(/tenant/i);
  });

  test("filtros por estado y canal y paginacion por cursor", async () => {
    route({ "GET /leads": () => resp({ items: [L1], next_cursor: "cur-1" }) });
    render(<App />);
    await screen.findByTestId("contacto-c1");
    fireEvent.change(screen.getByLabelText(/^estado$/i), { target: { value: "projected" } });
    await waitFor(() => expect(f.mock.calls.some((c) => /status=projected/.test(String(c[0])))).toBe(true));
    fireEvent.change(screen.getByLabelText(/^canal$/i), { target: { value: "email" } });
    await waitFor(() => expect(f.mock.calls.some((c) => /channel=email/.test(String(c[0])))).toBe(true));
    fireEvent.click(await screen.findByTestId("cargar-mas"));
    await waitFor(() => expect(f.mock.calls.some((c) => /cursor=cur-1/.test(String(c[0])))).toBe(true));
  });

  test("404 de tenant ajeno: ningun dato, aviso en texto", async () => {
    route({ "GET /leads": () => problem(404, "NOT_FOUND") });
    render(<App />);
    expect(await screen.findByTestId("estado-error-contactos")).toBeInTheDocument();
    expect(screen.queryByTestId("lista-contactos")).toBeNull();
    expect(document.body.textContent).not.toMatch(/synth\.invalid/);
  });

  test("estados vacio, error y 'no disponible'", async () => {
    route({ "GET /leads": () => resp({ items: [], next_cursor: null }) });
    const a = render(<App />);
    expect(await screen.findByTestId("estado-vacio-contactos")).toBeInTheDocument();
    a.unmount();
    route({ "GET /leads": () => problem(500, "UNAVAILABLE") });
    render(<App />);
    expect(await screen.findByTestId("estado-error-contactos")).toBeInTheDocument();
  });

  test("panel apagado: nada se pinta ni se llama a la red", () => {
    delete process.env.NEXT_PUBLIC_SITES_PANEL;
    render(<App />);
    expect(f).not.toHaveBeenCalled();
    expect(screen.queryByTestId("lista-contactos")).toBeNull();
  });

  test("modo demo: badge DEMO, mocks sinteticos y sin red de contactos", async () => {
    process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO = "1";
    f.mockImplementation(async () => problem(503, "UNAVAILABLE"));
    render(<App />);
    expect(await screen.findByTestId("badge-demo")).toBeInTheDocument();
    await screen.findByTestId("lista-contactos");
    expect(document.body.textContent).toMatch(/synth\.invalid|SYNTH/);
    expect(f.mock.calls.every((c) => !/leads/.test(String(c[0])))).toBe(true);
  });
});

describe("Mi web / Contactos: idioma", () => {
  test("ES/EN", async () => {
    route({ "GET /leads": LISTA });
    render(<App />);
    await screen.findByTestId("contacto-c1");
    fireEvent.change(screen.getByLabelText("Idioma"), { target: { value: "en" } });
    expect(await screen.findByLabelText(/^status$/i)).toBeInTheDocument();
    expect(screen.getByTestId("estado-c1").textContent).toMatch(/projected/i);
  });
});

describe("tipos escritos a mano vs C-SITES-LEADS 1.1.0", () => {
  const defs = (leadsSchema as unknown as { $defs: Record<string, { required?: string[] }> }).$defs;
  test("copia del contrato 1.1.0 y required de cada tipo", () => {
    expect((leadsSchema as unknown as { "x-contract": { version: string } })["x-contract"].version).toBe("1.1.0");
    for (const [n, req] of Object.entries(LEAD_REQUIRED)) expect([...req].sort()).toEqual([...(defs[n].required ?? [])].sort());
  });
});
