import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
let query = "";
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(query),
  usePathname: () => "/mi-web/propiedades",
}));
import { apiFetch } from "@/lib/api/fetch-client";
import Layout from "@/app/mi-web/layout";
import PropiedadesPage from "@/app/mi-web/propiedades/page";
import { resetDemoListings } from "@/lib/sites/mocks/listings";
import { resp, SITE_A, TENANT, siteOk } from "./fake";

const f = apiFetch as jest.Mock;
const problem = (status: number, code: string) => resp({ type: "x", title: "t", status, code }, status, "application/problem+json");
const listing = (slug: string, extra: object = {}) => ({
  id: `id-${slug}`, tenant_id: TENANT, vertical: "realestate", site_id: SITE_A, slug, publish_state: "draft", title: { es: `Casa ${slug}` }, ...extra,
});
type H = Record<string, () => Response>;
function route(h: H) {
  f.mockImplementation(async (url: string, init?: { method?: string }) => {
    const u = url.split("?")[0];
    const key = `${init?.method ?? "GET"} ${u.replace(/^.*\/sites\/[^/]+/, "")}`;
    if (u.endsWith("/api/v1/sites/sites")) return h.sites ? h.sites() : resp({ items: [siteOk], next_cursor: null });
    const fn = h[key] ?? h[`${init?.method ?? "GET"} *`];
    if (!fn) throw new Error(`url inesperada ${key}`);
    return fn();
  });
}
const App = () => (<Layout><PropiedadesPage /></Layout>);
const ENV = ["NEXT_PUBLIC_SITES_PANEL", "NEXT_PUBLIC_SITES_ALLOW_DEMO"] as const;
const sentTo = (m: string, p: string) => f.mock.calls.filter((c) => (c[1]?.method ?? "GET") === m && String(c[0]).split("?")[0].endsWith(p));

beforeEach(() => {
  f.mockReset();
  query = `sitio=${SITE_A}`;
  resetDemoListings();
  for (const k of ENV) delete process.env[k];
  process.env.NEXT_PUBLIC_SITES_PANEL = "1";
});
afterAll(() => { for (const k of ENV) delete process.env[k]; });

describe("Mi web / Propiedades: lista", () => {
  test("lista con estado en texto y sin tenant (positivo)", async () => {
    route({ "GET /listings": () => resp({ items: [listing("casa-a")], next_cursor: null }) });
    render(<App />);
    const fila = await screen.findByTestId("propiedad-casa-a");
    expect(fila.textContent).toContain("Casa casa-a");
    expect(screen.getByTestId("estado-propiedad-casa-a").textContent).toMatch(/borrador/i);
    expect(screen.queryByTestId("badge-demo")).toBeNull();
    expect(JSON.stringify(f.mock.calls)).not.toMatch(/tenant/i);
  });
  test("filtra por estado y busca por titulo", async () => {
    route({ "GET /listings": () => resp({ items: [listing("a"), listing("b", { publish_state: "published", title: { es: "Villa Azul" } })], next_cursor: null }) });
    render(<App />);
    await screen.findByTestId("propiedad-a");
    fireEvent.change(screen.getByTestId("filtro-estado"), { target: { value: "published" } });
    expect(screen.queryByTestId("propiedad-a")).toBeNull();
    expect(screen.getByTestId("propiedad-b")).toBeTruthy();
    fireEvent.change(screen.getByTestId("filtro-estado"), { target: { value: "" } });
    fireEvent.change(screen.getByTestId("buscar"), { target: { value: "azul" } });
    expect(screen.queryByTestId("propiedad-a")).toBeNull();
    expect(screen.getByTestId("propiedad-b")).toBeTruthy();
  });
  test("pagina por cursor sin duplicar filas", async () => {
    let n = 0;
    route({ "GET /listings": () => (n++ === 0 ? resp({ items: [listing("a"), listing("b")], next_cursor: "c2" }) : resp({ items: [listing("b"), listing("c")], next_cursor: null })) });
    render(<App />);
    await screen.findByTestId("propiedad-a");
    fireEvent.click(screen.getByTestId("cargar-mas"));
    await screen.findByTestId("propiedad-c");
    expect(screen.getAllByTestId("propiedad-b")).toHaveLength(1);
    expect(String(sentTo("GET", "/listings")[1][0])).toContain("cursor=c2");
    expect(screen.queryByTestId("cargar-mas")).toBeNull();
  });
  test("servicio caido o tenant ajeno: error sin datos (negativo)", async () => {
    for (const [s, c] of [[503, "UNKNOWN"], [403, "TENANT_MISMATCH"], [404, "NOT_FOUND"]] as const) {
      route({ "GET /listings": () => problem(s, c) });
      const { unmount } = render(<App />);
      expect((await screen.findByTestId("estado-error-propiedades")).getAttribute("role")).toBe("alert");
      expect(screen.queryByText(/SYNTH/)).toBeNull();
      unmount();
    }
  });
  test("modo demo: badge DEMO y 0 llamadas de red", async () => {
    process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO = "1";
    route({ sites: () => problem(503, "UNKNOWN") });
    query = "";
    render(<App />);
    expect(await screen.findByTestId("badge-demo")).toBeTruthy();
    expect((await screen.findAllByText(/SYNTH/)).length).toBeGreaterThan(0);
    expect(f.mock.calls.every((c) => String(c[0]).endsWith("/sites"))).toBe(true);
  });
});

