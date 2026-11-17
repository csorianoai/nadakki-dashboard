import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(`sitio=00000000-0000-4000-8000-0000000000b1`), usePathname: () => "/mi-web/desarrollos" }));
import { apiFetch } from "@/lib/api/fetch-client";
import Layout from "@/app/mi-web/layout";
import Page from "@/app/mi-web/desarrollos/page";
import { resetDemoCatalogo } from "@/lib/sites/catalogo/mock";
import { resp, SITE_A, TENANT, siteOk } from "./fake";

const f = apiFetch as jest.Mock;
const problem = (status: number, code: string) => resp({ type: "x", title: "t", status, code }, status, "application/problem+json");
type H = Record<string, () => Response>;
function route(h: H) {
  f.mockImplementation(async (url: string, init?: { method?: string }) => {
    const u = url.split("?")[0];
    if (u.endsWith("/api/v1/sites/sites")) return resp({ items: [siteOk], next_cursor: null });
    const fn = h[`${init?.method ?? "GET"} ${u.replace(/^.*\/sites\/[^/]+/, "")}`];
    if (!fn) throw new Error(`url inesperada ${init?.method ?? "GET"} ${u}`);
    return fn();
  });
}
const App = () => (<Layout><Page /></Layout>);
const ENV = ["NEXT_PUBLIC_SITES_PANEL", "NEXT_PUBLIC_SITES_ALLOW_DEMO"] as const;
const sent = (m: string, p: string) => f.mock.calls.filter((c) => (c[1]?.method ?? "GET") === m && String(c[0]).split("?")[0].endsWith(p));
const type = (id: string, value: string) => fireEvent.change(screen.getByTestId(id), { target: { value } });
const base = { tenant_id: TENANT, vertical: "realestate", site_id: SITE_A, publish_state: "draft" };
const dev = (extra: object = {}) => ({ id: "d1", slug: "torre-a", name: "Torre A", authorized: false, ...base, ...extra });

beforeEach(() => {
  f.mockReset();
  resetDemoCatalogo();
  for (const k of ENV) delete process.env[k];
  process.env.NEXT_PUBLIC_SITES_PANEL = "1";
});
afterAll(() => { for (const k of ENV) delete process.env[k]; });

describe("Mi web / Desarrollos, zonas y edificios", () => {
  test("crear una zona y un edificio de esa zona: POST con Idempotency-Key y sin tenant_id (positivo)", async () => {
    let creada = false;
    const zona = { id: "z1", slug: "piantini", name: { es: "Piantini" }, ...base };
    route({
      "GET /developments": () => resp({ items: [], next_cursor: null }),
      "GET /zones": () => resp({ items: creada ? [zona] : [], next_cursor: null }),
      "GET /buildings": () => resp({ items: [], next_cursor: null }),
      "POST /zones": () => { creada = true; return resp(zona, 201); },
      "POST /buildings": () => resp({ id: "b1", slug: "torre-z", name: "Torre Z", zone_id: "z1", ...base }, 201),
    });
    render(<App />);
    fireEvent.click(await screen.findByTestId("tab-zonas"));
    fireEvent.click(await screen.findByTestId("nuevo-zonas"));
    type("slug", "piantini"); type("nombre-es", "Piantini");
    fireEvent.click(screen.getByTestId("guardar"));
    await screen.findByTestId("guardado");
    const z = sent("POST", "/zones")[0];
    expect(z[1].headers["Idempotency-Key"]).toBeTruthy();
    expect(JSON.parse(z[1].body)).toEqual({ slug: "piantini", name: { es: "Piantini" } });
    fireEvent.click(screen.getByTestId("volver"));
    fireEvent.click(screen.getByTestId("tab-edificios"));
    fireEvent.click(await screen.findByTestId("nuevo-edificios"));
    await waitFor(() => expect((screen.getByTestId("zona") as HTMLSelectElement).disabled).toBe(false));
    type("slug", "torre-z"); type("nombre", "Torre Z"); type("zona", "z1");
    fireEvent.click(screen.getByTestId("guardar"));
    await screen.findByTestId("guardado");
    const b = sent("POST", "/buildings")[0];
    expect(b[1].headers["Idempotency-Key"]).toBeTruthy();
    expect(JSON.parse(b[1].body)).toEqual({ slug: "torre-z", name: "Torre Z", zone_id: "z1" });
    expect(JSON.stringify(f.mock.calls)).not.toMatch(/tenant/i);
  });

  test("zona con dato de mercado y sin fuente/fecha bloquea el envio (negativo)", async () => {
    route({ "GET /zones": () => resp({ items: [], next_cursor: null }) });
    render(<App />);
    fireEvent.click(await screen.findByTestId("tab-zonas"));
    fireEvent.click(await screen.findByTestId("nuevo-zonas"));
    type("slug", "naco"); type("nombre-es", "Naco"); type("precio-min", "100000"); type("moneda", "USD");
    fireEvent.click(screen.getByTestId("guardar"));
    for (const id of ["fuente", "fecha-fuente"]) {
      const e = await screen.findByTestId(`error-${id}`);
      expect(e.getAttribute("role")).toBe("alert");
      expect(screen.getByTestId(id).getAttribute("aria-describedby")).toBe(`err-${id}`);
    }
    expect(sent("POST", "/zones")).toHaveLength(0);
  });

  test("sin controles ni llamadas de staff; authorized solo como texto de lectura", async () => {
    route({ "GET /developments": () => resp({ items: [dev()], next_cursor: null }), "GET /developments/d1": () => resp(dev()) });
    const { container } = render(<App />);
    const fila = await screen.findByTestId("fila-torre-a");
    expect(fila.textContent).toMatch(/Pendiente de verificación de Nadakki/);
    expect(screen.queryByText(/publicar/i, { selector: "button" })).toBeNull();
    fireEvent.click(screen.getByTestId("editar-torre-a"));
    const v = await screen.findByTestId("verificacion");
    expect(v.textContent).toMatch(/Verificado por Nadakki: pendiente/);
    expect(container.querySelector("[name*=authoriz i],[id*=authoriz i],[data-testid*=authoriz i],[data-testid*=legal i]")).toBeNull();
    expect(v.querySelector("input,select,button,textarea")).toBeNull();
    expect(JSON.stringify(f.mock.calls)).not.toMatch(/\/staff\/|setDevelopmentAuthorization|authoriz/i);
    expect(container.innerHTML).not.toMatch(/\/staff\//);
  });

  test.each(["LEGAL_FIELD_STAFF_ONLY", "FORBIDDEN"])("%s se pinta en llano con role=alert", async (code) => {
    route({ "GET /developments": () => resp({ items: [], next_cursor: null }), "POST /developments": () => problem(403, code) });
    render(<App />);
    fireEvent.click(await screen.findByTestId("nuevo-desarrollos"));
    type("slug", "torre-b"); type("nombre", "Torre B");
    fireEvent.click(screen.getByTestId("guardar"));
    const a = await screen.findByTestId("error-guardar");
    expect(a.getAttribute("role")).toBe("alert");
    expect(a.textContent).not.toContain(code);
    expect(a.textContent).toMatch(/Nadakki|permiso/);
  });

  test("getDevelopment de otro tenant (404) -> 'no encontrado' sin filtrar nada (tenant ajeno)", async () => {
    route({ "GET /developments": () => resp({ items: [dev()], next_cursor: null }), "GET /developments/d1": () => problem(404, "NOT_FOUND") });
    render(<App />);
    fireEvent.click(await screen.findByTestId("editar-torre-a"));
    const n = await screen.findByTestId("estado-no-encontrado");
    expect(n.textContent).toMatch(/no encontrado/i);
    expect(screen.queryByTestId("form-desarrollos")).toBeNull();
  });

  test("403 TENANT_MISMATCH al guardar es error, no dato", async () => {
    route({ "GET /zones": () => resp({ items: [], next_cursor: null }), "POST /zones": () => problem(403, "TENANT_MISMATCH") });
    render(<App />);
    fireEvent.click(await screen.findByTestId("tab-zonas"));
    fireEvent.click(await screen.findByTestId("nuevo-zonas"));
    type("slug", "x"); type("nombre-es", "X");
    fireEvent.click(screen.getByTestId("guardar"));
    expect((await screen.findByTestId("error-guardar")).getAttribute("role")).toBe("alert");
    expect(screen.queryByTestId("guardado")).toBeNull();
  });

  test("pestanas: role=tablist, flechas cambian y respetan aria-selected", async () => {
    route({ "GET /developments": () => resp({ items: [], next_cursor: null }), "GET /zones": () => resp({ items: [], next_cursor: null }), "GET /buildings": () => resp({ items: [], next_cursor: null }) });
    render(<App />);
    const d = await screen.findByTestId("tab-desarrollos");
    expect(screen.getByRole("tablist")).toBeTruthy();
    expect(d.getAttribute("aria-selected")).toBe("true");
    fireEvent.keyDown(d, { key: "ArrowRight" });
    expect(screen.getByTestId("tab-zonas").getAttribute("aria-selected")).toBe("true");
    expect(d.getAttribute("aria-selected")).toBe("false");
    expect(document.activeElement).toBe(screen.getByTestId("tab-zonas"));
    fireEvent.keyDown(screen.getByTestId("tab-zonas"), { key: "ArrowLeft" });
    fireEvent.keyDown(screen.getByTestId("tab-desarrollos"), { key: "ArrowLeft" });
    expect(screen.getByTestId("tab-edificios").getAttribute("aria-selected")).toBe("true");
    await screen.findByTestId("lista-edificios");
  });

  test("servicio caido sin demo: estado no disponible, sin mocks", async () => {
    route({ "GET /developments": () => problem(503, "UNKNOWN") });
    render(<App />);
    expect((await screen.findByTestId("estado-error-catalogo")).getAttribute("role")).toBe("alert");
    expect(screen.queryByTestId("badge-demo")).toBeNull();
  });

  test("modo demo: badge DEMO y 0 llamadas de red fuera del listado de sitios", async () => {
    process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO = "1";
    route({ sites: () => problem(503, "UNKNOWN") });
    f.mockImplementation(async (url: string) => { if (String(url).endsWith("/sites")) return problem(503, "UNKNOWN"); throw new Error("red"); });
    render(<App />);
    expect(await screen.findByTestId("badge-demo")).toBeTruthy();
    fireEvent.click(await screen.findByTestId("nuevo-desarrollos"));
    type("slug", "demo-a"); type("nombre", "Demo A");
    await act(async () => { fireEvent.click(screen.getByTestId("guardar")); });
    expect((await screen.findByTestId("guardado")).textContent).toMatch(/ejemplo/i);
    expect(f.mock.calls.every((c) => String(c[0]).endsWith("/sites"))).toBe(true);
  });
});
