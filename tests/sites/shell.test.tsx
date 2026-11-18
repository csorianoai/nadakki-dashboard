import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
let query = "";
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(query),
  usePathname: () => "/mi-web",
}));
import { apiFetch } from "@/lib/api/fetch-client";
import Layout from "@/app/mi-web/layout";
import { resp, SITE_A, TENANT, siteOk } from "./fake";

const f = apiFetch as jest.Mock;
const problem = (status: number, code: string) => resp({ type: "x", title: "t", status, code }, status, "application/problem+json");
function route(map: Record<string, () => Response>) {
  f.mockImplementation(async (url: string) => {
    const k = Object.keys(map).find((p) => url.split("?")[0].endsWith(p));
    if (!k) throw new Error(`url inesperada ${url}`);
    return map[k]();
  });
}
const App = () => (
  <Layout>
    <p>contenido de prueba</p>
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

describe("Mi web / armazon", () => {
  test("panel apagado: no se pinta nada y no hay llamadas (negativo)", () => {
    delete process.env.NEXT_PUBLIC_SITES_PANEL;
    const { container } = render(<App />);
    expect(container.innerHTML).toBe("");
    process.env.NEXT_PUBLIC_SITES_PANEL = "true";
    const r2 = render(<App />);
    expect(r2.container.innerHTML).toBe("");
    expect(f).not.toHaveBeenCalled();
  });

  test("panel encendido y 200: comprobando, luego contenido, skip-link y navegacion (positivo)", async () => {
    route({ "/sites": () => resp({ items: [siteOk], next_cursor: null }) });
    render(<App />);
    expect(screen.getByText(/comprobando/i)).toBeTruthy();
    expect(await screen.findByText("contenido de prueba")).toBeTruthy();
    expect(screen.queryByTestId("badge-demo")).toBeNull();
    expect(screen.getByText(/saltar al contenido/i)).toBeTruthy();
    for (const s of ["Resumen", "Páginas", "Propiedades", "Medios", "Desarrollos", "Publicar", "Vista previa"]) {
      expect(screen.getAllByRole("link", { name: s }).length).toBeGreaterThan(0);
    }
    expect(screen.getAllByRole("link", { name: "Publicar" })[0].getAttribute("href")).toBe(`/mi-web/publicar?sitio=${SITE_A}`);
  });

  test("403: 'sin acceso' y ningun dato", async () => {
    route({ "/sites": () => problem(403, "FORBIDDEN") });
    render(<App />);
    expect(await screen.findByTestId("estado-sin-acceso")).toBeTruthy();
    expect(screen.queryByText("contenido de prueba")).toBeNull();
    expect(screen.queryByTestId("badge-demo")).toBeNull();
  });

  test("403 TENANT_MISMATCH es error, nunca dato", async () => {
    route({ "/sites": () => problem(403, "TENANT_MISMATCH") });
    render(<App />);
    expect(await screen.findByTestId("estado-sin-acceso")).toBeTruthy();
    expect(screen.queryByText("contenido de prueba")).toBeNull();
  });

  test.each([404, 503])("%s sin ALLOW_DEMO: UNAVAILABLE sin cifras ni mocks", async (st) => {
    route({ "/sites": () => problem(st, st === 404 ? "NOT_FOUND" : "UNKNOWN") });
    const { container } = render(<App />);
    expect(await screen.findByTestId("estado-unavailable")).toBeTruthy();
    expect(screen.queryByText("contenido de prueba")).toBeNull();
    expect(screen.queryByTestId("badge-demo")).toBeNull();
    expect(container.textContent).not.toMatch(/\d/);
    expect(screen.getByRole("alert").textContent).toMatch(/no está disponible/i);
  });

  test("ALLOW_DEMO='1' y API caida: contenido CON badge DEMO", async () => {
    process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO = "1";
    f.mockRejectedValue(new TypeError("fetch failed"));
    render(<App />);
    expect(await screen.findByText("contenido de prueba")).toBeTruthy();
    expect(screen.getAllByTestId("badge-demo").length).toBeGreaterThan(0);
  });

  test("ALLOW_DEMO distinto de '1' no habilita mocks", async () => {
    process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO = "true";
    f.mockRejectedValue(new TypeError("fetch failed"));
    render(<App />);
    expect(await screen.findByTestId("estado-unavailable")).toBeTruthy();
    expect(screen.queryByText("contenido de prueba")).toBeNull();
  });

  test("403 con ALLOW_DEMO sigue siendo 'sin acceso' (no se disfraza con mocks)", async () => {
    process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO = "1";
    route({ "/sites": () => problem(403, "TENANT_MISMATCH") });
    render(<App />);
    expect(await screen.findByTestId("estado-sin-acceso")).toBeTruthy();
    expect(screen.queryByTestId("badge-demo")).toBeNull();
  });

  test("lista vacia: aviso con el motivo", async () => {
    route({ "/sites": () => resp({ items: [], next_cursor: null }) });
    render(<App />);
    expect((await screen.findByTestId("estado-vacio")).textContent).toMatch(/todavía no tiene/i);
  });

  test("ES/EN: alternar cambia los textos", async () => {
    route({ "/sites": () => resp({ items: [siteOk], next_cursor: null }) });
    render(<App />);
    await screen.findByText("contenido de prueba");
    fireEvent.change(screen.getByLabelText(/idioma/i), { target: { value: "en" } });
    expect(screen.getAllByRole("link", { name: "Preview" }).length).toBeGreaterThan(0);
    expect(screen.getByText(/skip to content/i)).toBeTruthy();
    fireEvent.change(screen.getByLabelText(/language/i), { target: { value: "es" } });
    expect(screen.getAllByRole("link", { name: "Vista previa" }).length).toBeGreaterThan(0);
  });

  test("nunca viaja tenant_id en ninguna URL, cuerpo ni cabecera", async () => {
    query = `sitio=${SITE_A}`;
    route({ "/sites": () => resp({ items: [siteOk], next_cursor: null }) });
    render(<App />);
    await screen.findByText("contenido de prueba");
    expect(f.mock.calls.length).toBeGreaterThan(0);
    for (const c of f.mock.calls) {
      const blob = JSON.stringify(c);
      expect(blob).not.toMatch(/tenant/i);
      expect(blob).not.toContain(TENANT);
    }
    expect(urls().every((u) => u.startsWith("/api/v1/sites/"))).toBe(true);
  });
});
