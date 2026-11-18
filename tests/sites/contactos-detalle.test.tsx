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
import { resetDemoLeads } from "@/lib/sites/contactos/mock";
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
const L1 = lead("c1", { ad_click: { click_consent: "granted", gclid: GCLID, fbclid: "SYNTHfb-9" } });
const L2 = lead("c2", { ad_click: { click_consent: "denied", gclid: "SYNTH-LEAK-DENIED" } });
const L3 = lead("c3", { ad_click: { click_consent: "unknown", gclid: "SYNTH-LEAK-UNKNOWN" } });
const REVOKED = { ...L1, consents: [consent("email", "revoked"), consent("whatsapp", "denied")], contactable_channels: [] };
type H = Record<string, (init?: { headers?: Record<string, string> }) => Response>;
function route(h: H) {
  f.mockImplementation(async (url: string, init?: { method?: string; headers?: Record<string, string> }) => {
    const u = url.split("?")[0];
    if (u.endsWith("/api/v1/sites/sites")) return resp({ items: [siteOk], next_cursor: null });
    const key = `${init?.method ?? "GET"} ${u.replace(/^.*\/sites\/[^/]+/, "")}`;
    const fn = h[key];
    if (!fn) throw new Error(`url inesperada ${key}`);
    return fn(init);
  });
}
const App = () => (<Layout><ContactosPage /></Layout>);
const ENV = ["NEXT_PUBLIC_SITES_PANEL", "NEXT_PUBLIC_SITES_ALLOW_DEMO"] as const;
const LISTA = () => resp({ items: [L1, L2, L3], next_cursor: null });
const posts = () => f.mock.calls.filter((c) => c[1]?.method === "POST");
async function abrir(id: string) {
  fireEvent.click(await screen.findByTestId(`ver-${id}`));
  return screen.findByTestId("detalle-contacto");
}

beforeEach(() => {
  f.mockReset();
  resetDemoLeads();
  for (const k of ENV) delete process.env[k];
  process.env.NEXT_PUBLIC_SITES_PANEL = "1";
});
afterAll(() => { for (const k of ENV) delete process.env[k]; });

describe("Mi web / Contactos: detalle", () => {
  test("muestra mensaje, consentimiento por canal con version y fecha, y ids de clic como texto si granted", async () => {
    route({ "GET /leads": LISTA, "GET /leads/c1": () => resp(L1) });
    render(<App />);
    const d = await abrir("c1");
    expect(d.textContent).toContain("Mensaje de c1");
    const e = within(d).getByTestId("consent-email");
    expect(e.textContent).toContain("consent-email-2026-10");
    expect(e.textContent).toContain("2026-11-07");
    expect(within(d).getByTestId("consent-whatsapp").textContent).toContain("consent-whatsapp-2026-10");
    expect(d.textContent).toContain(GCLID);
    expect(d.textContent).toContain("SYNTHfb-9");
    for (const c of f.mock.calls) expect(String(c[0])).not.toMatch(/synth\.invalid|Visitante|SYNTH|tenant/i);
  });

  test.each([["c2", "SYNTH-LEAK-DENIED"], ["c3", "SYNTH-LEAK-UNKNOWN"]])("click_consent denied/unknown (%s): sin ids aunque el servidor los envie", async (id, leak) => {
    route({ "GET /leads": LISTA, [`GET /leads/${id}`]: () => resp(id === "c2" ? L2 : L3) });
    render(<App />);
    const d = await abrir(id);
    expect(d.textContent).toMatch(/sin identificadores \(consentimiento denegado o desconocido\)/i);
    expect(document.body.textContent).not.toContain(leak);
  });

  test("la lista nunca muestra ids de clic ni con el detalle abierto en otro contacto", async () => {
    route({ "GET /leads": LISTA, "GET /leads/c1": () => resp(L1) });
    render(<App />);
    await abrir("c1");
    expect(within(screen.getByTestId("lista-contactos")).queryByText(new RegExp(GCLID))).toBeNull();
  });

  test("404 de tenant ajeno en el detalle: ningun dato", async () => {
    route({ "GET /leads": LISTA, "GET /leads/c1": () => problem(404, "NOT_FOUND") });
    render(<App />);
    fireEvent.click(await screen.findByTestId("ver-c1"));
    expect(await screen.findByTestId("estado-error-detalle")).toBeInTheDocument();
    expect(screen.queryByTestId("detalle-contacto")).toBeNull();
    expect(document.body.textContent).not.toContain("Mensaje de c1");
    expect(document.body.textContent).not.toContain(GCLID);
  });
});

describe("Mi web / Contactos: revocar consentimiento", () => {
  const REV = "POST /leads/c1/consents/email/revoke";
  test("pide confirmacion, llama una vez con Idempotency-Key y actualiza canales", async () => {
    route({ "GET /leads": LISTA, "GET /leads/c1": () => resp(L1), [REV]: () => resp(REVOKED) });
    render(<App />);
    await abrir("c1");
    fireEvent.click(screen.getByRole("button", { name: /revocar consentimiento.*correo/i }));
    expect(posts()).toHaveLength(0);
    fireEvent.click(await screen.findByTestId("confirmar-revocar"));
    await waitFor(() => expect(posts()).toHaveLength(1));
    const h = posts()[0][1].headers as Record<string, string>;
    expect(h["Idempotency-Key"]).toMatch(/^.{16,128}$/);
    expect(posts()[0][1].body).toBeUndefined();
    await waitFor(() => expect(screen.getByTestId("consent-email").textContent).toMatch(/revocado/i));
    expect(screen.queryByRole("button", { name: /revocar consentimiento.*correo/i })).toBeNull();
    expect(screen.getByTestId("canales-c1").textContent).toMatch(/ninguno/i);
  });

  test("cancelar no llama a la red", async () => {
    route({ "GET /leads": LISTA, "GET /leads/c1": () => resp(L1), [REV]: () => resp(REVOKED) });
    render(<App />);
    await abrir("c1");
    fireEvent.click(screen.getByRole("button", { name: /revocar consentimiento.*correo/i }));
    fireEvent.click(await screen.findByRole("button", { name: /cancelar/i }));
    expect(posts()).toHaveLength(0);
    expect(screen.queryByTestId("confirmar-revocar")).toBeNull();
  });

  test("tras un fallo, el reintento reutiliza la misma Idempotency-Key", async () => {
    let n = 0;
    route({ "GET /leads": LISTA, "GET /leads/c1": () => resp(L1), [REV]: () => (++n === 1 ? problem(503, "UNAVAILABLE") : resp(REVOKED)) });
    render(<App />);
    await abrir("c1");
    const abre = () => fireEvent.click(screen.getByRole("button", { name: /revocar consentimiento.*correo/i }));
    abre();
    fireEvent.click(await screen.findByTestId("confirmar-revocar"));
    expect(await screen.findByTestId("error-revocar")).toBeInTheDocument();
    fireEvent.click(await screen.findByTestId("confirmar-revocar"));
    await waitFor(() => expect(posts()).toHaveLength(2));
    const k = (i: number) => (posts()[i][1].headers as Record<string, string>)["Idempotency-Key"];
    expect(k(0)).toBe(k(1));
  });

  test("409: mensaje 'ya revocado'", async () => {
    route({ "GET /leads": LISTA, "GET /leads/c1": () => resp(L1), [REV]: () => problem(409, "CONFLICT") });
    render(<App />);
    await abrir("c1");
    fireEvent.click(screen.getByRole("button", { name: /revocar consentimiento.*correo/i }));
    fireEvent.click(await screen.findByTestId("confirmar-revocar"));
    expect((await screen.findByTestId("aviso-ya-revocado")).textContent).toMatch(/ya revocado/i);
  });

  test("sin boton de borrar contacto; solo se revoca lo vigente", async () => {
    route({ "GET /leads": LISTA, "GET /leads/c1": () => resp(L1) });
    render(<App />);
    await abrir("c1");
    expect(screen.queryByRole("button", { name: /borrar|eliminar|delete/i })).toBeNull();
    expect(screen.queryByRole("button", { name: /revocar consentimiento.*whatsapp/i })).toBeNull();
  });

  test("EN: etiquetas en ingles", async () => {
    route({ "GET /leads": LISTA, "GET /leads/c1": () => resp(L1) });
    render(<App />);
    await screen.findByTestId("ver-c1");
    fireEvent.change(screen.getByLabelText("Idioma"), { target: { value: "en" } });
    fireEvent.click(await screen.findByTestId("ver-c1"));
    await screen.findByTestId("detalle-contacto");
    expect(screen.getByRole("button", { name: /revoke consent.*email/i })).toBeInTheDocument();
  });

  test("demo: revoca en memoria sin red de contactos", async () => {
    process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO = "1";
    f.mockImplementation(async () => problem(503, "UNAVAILABLE"));
    render(<App />);
    expect(await screen.findByTestId("badge-demo")).toBeInTheDocument();
    const rows = await screen.findAllByRole("button", { name: /ver detalle/i });
    fireEvent.click(rows[0]);
    await screen.findByTestId("detalle-contacto");
    fireEvent.click(screen.getByRole("button", { name: /revocar consentimiento.*correo/i }));
    fireEvent.click(await screen.findByTestId("confirmar-revocar"));
    await waitFor(() => expect(screen.getByTestId("consent-email").textContent).toMatch(/revocado/i));
    expect(f.mock.calls.every((c) => !/leads/.test(String(c[0])))).toBe(true);
  });
});
