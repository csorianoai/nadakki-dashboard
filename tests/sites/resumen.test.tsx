import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
let query = "";
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(query),
  usePathname: () => "/mi-web",
}));
import { apiFetch } from "@/lib/api/fetch-client";
import Layout from "@/app/mi-web/layout";
import Page from "@/app/mi-web/page";
import { resp, SITE_A, TENANT, siteOk } from "./fake";

const f = apiFetch as jest.Mock;
const problem = (status: number, code: string) => resp({ type: "x", title: "t", status, code }, status, "application/problem+json");
const SITE_B = "00000000-0000-4000-8000-0000000000b2";
const siteLive = { ...siteOk, status: "published", content_version: 7, published_at: "2026-10-01T10:00:00Z", compliance: { last_result: "warn" } };
const readiness = (n: number) => ({
  site_id: SITE_A, ready: n === 0, evaluated_at: "2026-10-01T10:00:00Z", warnings: [], info: [],
  blocking: Array.from({ length: n }, (_, i) => ({ rule_id: `R${i}`, severity: "block", message: "m", field: "f" })),
});

function route(map: Record<string, () => Response>) {
  f.mockImplementation(async (url: string) => {
    const k = Object.keys(map).find((p) => url.split("?")[0].endsWith(p));
    if (!k) throw new Error(`url inesperada ${url}`);
    return map[k]();
  });
}
const App = () => (
  <Layout>
    <Page />
  </Layout>
);
const urls = () => f.mock.calls.map((c) => String(c[0]));
const ENV = ["NEXT_PUBLIC_SITES_PANEL", "NEXT_PUBLIC_SITES_ALLOW_DEMO"] as const;

beforeEach(() => {
  f.mockReset();
  query = "";
  for (const k of ENV) delete process.env[k];
  process.env.NEXT_PUBLIC_SITES_PANEL = "1";
});
afterAll(() => { for (const k of ENV) delete process.env[k]; });

describe("Mi web / Resumen", () => {
  test("panel apagado: no se pinta nada y no hay llamadas (negativo)", () => {
    delete process.env.NEXT_PUBLIC_SITES_PANEL;
    const { container } = render(<App />);
    expect(container.innerHTML).toBe("");
    process.env.NEXT_PUBLIC_SITES_PANEL = "true";
    const r2 = render(<App />);
    expect(r2.container.innerHTML).toBe("");
    expect(f).not.toHaveBeenCalled();
  });

  test("panel encendido y 200: resumen con estado en texto, version, ultima publicacion, gate y enlace a Publicar (positivo)", async () => {
    route({ "/sites": () => resp({ items: [siteLive], next_cursor: null }), "/readiness": () => resp(readiness(2)) });
    render(<App />);
    expect(screen.getByText(/comprobando/i)).toBeTruthy();
    expect(await screen.findByText("SYNTH Realty")).toBeTruthy();
    expect(screen.getByTestId("estado-sitio").textContent).toMatch(/publicado/i);
    expect(screen.getByTestId("version").textContent).toContain("7");
    expect(screen.getByTestId("ultima-publicacion").textContent).toMatch(/2026/);
    expect(screen.getByTestId("gate").textContent).toMatch(/advertencias/i);
    expect(screen.getByTestId("bloqueos").textContent).toContain("2");
    expect((screen.getByRole("link", { name: /^publicar$/i }) as HTMLAnchorElement).getAttribute("href")).toBe(`/mi-web/publicar?sitio=${SITE_A}`);
    expect(screen.queryByTestId("badge-demo")).toBeNull();
    expect(screen.getByText(/saltar al contenido/i)).toBeTruthy();
    for (const s of ["Resumen", "Páginas", "Propiedades", "Medios", "Desarrollos", "Publicar", "Vista previa"]) {
      expect(screen.getAllByRole("link", { name: s }).length).toBeGreaterThan(0);
    }
  });

  test("sin bloqueos pendientes no se muestra la cuenta", async () => {
    route({ "/sites": () => resp({ items: [siteOk], next_cursor: null }), "/readiness": () => resp(readiness(0)) });
    render(<App />);
    await screen.findByText("SYNTH Realty");
    await waitFor(() => expect(f.mock.calls.length).toBeGreaterThan(1));
    expect(screen.queryByTestId("bloqueos")).toBeNull();
    expect(screen.getByTestId("estado-sitio").textContent).toMatch(/borrador/i);
    expect(screen.getByTestId("ultima-publicacion").textContent).toMatch(/aún no/i);
  });

  test("403: 'sin acceso' y ningun dato", async () => {
    route({ "/sites": () => problem(403, "FORBIDDEN") });
    render(<App />);
    expect(await screen.findByTestId("estado-sin-acceso")).toBeTruthy();
    expect(screen.queryByText("SYNTH Realty")).toBeNull();
    expect(screen.queryByTestId("badge-demo")).toBeNull();
  });

  test.each([404, 503])("%s sin ALLOW_DEMO: UNAVAILABLE sin cifras ni mocks", async (st) => {
    route({ "/sites": () => problem(st, st === 404 ? "NOT_FOUND" : "UNKNOWN") });
    const { container } = render(<App />);
    expect(await screen.findByTestId("estado-unavailable")).toBeTruthy();
    expect(screen.queryByText(/SYNTH/)).toBeNull();
    expect(screen.queryByTestId("badge-demo")).toBeNull();
    expect(container.textContent).not.toMatch(/\d/);
    expect(screen.getByRole("alert").textContent).toMatch(/no está disponible/i);
  });

  test("ALLOW_DEMO='1' y API caida: mocks CON badge DEMO", async () => {
    process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO = "1";
    f.mockRejectedValue(new TypeError("fetch failed"));
    render(<App />);
    expect(await screen.findByText(/SYNTH/)).toBeTruthy();
    expect(screen.getAllByTestId("badge-demo").length).toBeGreaterThan(0);
  });

  test("ALLOW_DEMO distinto de '1' no habilita mocks", async () => {
    process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO = "true";
    f.mockRejectedValue(new TypeError("fetch failed"));
    render(<App />);
    expect(await screen.findByTestId("estado-unavailable")).toBeTruthy();
    expect(screen.queryByText(/SYNTH/)).toBeNull();
  });

  test("403 con ALLOW_DEMO sigue siendo 'sin acceso' (no se disfraza con mocks)", async () => {
    process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO = "1";
    route({ "/sites": () => problem(403, "TENANT_MISMATCH") });
    render(<App />);
    expect(await screen.findByTestId("estado-sin-acceso")).toBeTruthy();
    expect(screen.queryByText(/SYNTH/)).toBeNull();
  });

  test("lista vacia: aviso con el motivo", async () => {
    route({ "/sites": () => resp({ items: [], next_cursor: null }) });
    render(<App />);
    expect((await screen.findByTestId("estado-vacio")).textContent).toMatch(/todavía no tiene/i);
  });

  test("?sitio= de otro tenant (404): 'no encontrado' sin nombre", async () => {
    query = `sitio=${SITE_B}`;
    route({ "/sites": () => resp({ items: [siteLive], next_cursor: null }), [`/sites/${SITE_B}`]: () => problem(404, "NOT_FOUND") });
    const { container } = render(<App />);
    expect(await screen.findByTestId("estado-no-encontrado")).toBeTruthy();
    expect(container.textContent).not.toContain("SYNTH Realty");
    expect(container.textContent).not.toContain(SITE_B);
  });

  test("varios sitios: selector accesible y el id viaja en ?sitio=", async () => {
    const otro = { ...siteOk, id: SITE_B, name: { es: "SYNTH Casa Dos" } };
    route({ "/sites": () => resp({ items: [siteOk, otro], next_cursor: null }), "/readiness": () => resp(readiness(0)) });
    render(<App />);
    const sel = (await screen.findByLabelText(/sitio/i)) as HTMLSelectElement;
    expect(sel.tagName).toBe("SELECT");
    expect(Array.from(sel.options).map((o) => o.value)).toEqual([SITE_A, SITE_B]);
    expect(screen.getByRole("link", { name: /^publicar$/i }).getAttribute("href")).toContain(`sitio=${SITE_A}`);
  });

  test("ES/EN: alternar cambia los textos y 'es' es el respaldo", async () => {
    route({ "/sites": () => resp({ items: [{ ...siteOk, name: { es: "SYNTH Solo ES" } }], next_cursor: null }), "/readiness": () => resp(readiness(0)) });
    render(<App />);
    await screen.findByText("SYNTH Solo ES");
    expect(screen.getByTestId("estado-sitio").textContent).toMatch(/borrador/i);
    fireEvent.change(screen.getByLabelText(/idioma/i), { target: { value: "en" } });
    expect(screen.getByTestId("estado-sitio").textContent).toMatch(/draft/i);
    expect(screen.getAllByRole("link", { name: "Preview" }).length).toBeGreaterThan(0);
    expect(screen.getByText("SYNTH Solo ES")).toBeTruthy(); // sin 'en' -> respaldo 'es'
    fireEvent.change(screen.getByLabelText(/language/i), { target: { value: "es" } });
    expect(screen.getByTestId("estado-sitio").textContent).toMatch(/borrador/i);
  });

  test("nunca viaja tenant_id en ninguna URL, cuerpo ni cabecera", async () => {
    query = `sitio=${SITE_A}`;
    route({ "/sites": () => resp({ items: [siteOk], next_cursor: null }), [`/sites/${SITE_A}`]: () => resp(siteOk), "/readiness": () => resp(readiness(1)) });
    render(<App />);
    await screen.findByText("SYNTH Realty");
    await waitFor(() => expect(f.mock.calls.length).toBeGreaterThan(2));
    for (const c of f.mock.calls) {
      const blob = JSON.stringify(c);
      expect(blob).not.toMatch(/tenant/i);
      expect(blob).not.toContain(TENANT);
    }
    expect(urls().every((u) => u.startsWith("/api/v1/sites/"))).toBe(true);
  });
});
