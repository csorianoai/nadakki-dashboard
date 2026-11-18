import React from "react";
import { render, screen } from "@testing-library/react";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
let query = "";
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(query),
  usePathname: () => "/mi-web/paginas",
}));
import { apiFetch } from "@/lib/api/fetch-client";
import Layout from "@/app/mi-web/layout";
import PaginasPage from "@/app/mi-web/paginas/page";
import { resetDemoPages } from "@/lib/sites/mocks/pages";
import { resp, SITE_A, TENANT, siteOk } from "./fake";

const f = apiFetch as jest.Mock;
const PAGE_ID = "00000000-0000-4000-8000-0000000000c1";
const problem = (status: number, code: string) => resp({ type: "x", title: "t", status, code }, status, "application/problem+json");
const page = { id: PAGE_ID, tenant_id: TENANT, vertical: "realestate", site_id: SITE_A, page_key: "inicio", status: "draft", title: { es: "SYNTH Inicio" } };

function route(list: () => Response, sites: () => Response = () => resp({ items: [siteOk], next_cursor: null })) {
  f.mockImplementation(async (url: string) => {
    const u = url.split("?")[0];
    if (u.endsWith("/pages")) return list();
    if (u.endsWith("/sites")) return sites();
    throw new Error(`url inesperada ${u}`);
  });
}
const App = () => (
  <Layout>
    <PaginasPage />
  </Layout>
);
const ENV = ["NEXT_PUBLIC_SITES_PANEL", "NEXT_PUBLIC_SITES_ALLOW_DEMO"] as const;

beforeEach(() => {
  f.mockReset();
  query = `sitio=${SITE_A}`;
  resetDemoPages();
  for (const k of ENV) delete process.env[k];
  process.env.NEXT_PUBLIC_SITES_PANEL = "1";
});
afterAll(() => { for (const k of ENV) delete process.env[k]; });

describe("Mi web / Paginas: lista", () => {
  test("lista con page_key, titulo y estado en texto (positivo)", async () => {
    route(() => resp({ items: [page], next_cursor: null }));
    render(<App />);
    const fila = await screen.findByTestId("pagina-inicio");
    expect(fila.textContent).toContain("inicio");
    expect(fila.textContent).toContain("SYNTH Inicio");
    expect(screen.getByTestId("estado-pagina-inicio").textContent).toMatch(/borrador/i);
    expect((screen.getByTestId("editar-inicio") as HTMLAnchorElement).getAttribute("href")).toBe(`/mi-web/paginas?sitio=${SITE_A}&pagina=${PAGE_ID}`);
    expect(screen.queryByTestId("badge-demo")).toBeNull();
    expect(JSON.stringify(f.mock.calls)).not.toMatch(/tenant/i);
  });

  test("servicio caido sin interruptor demo: no disponible, sin datos ni mocks (negativo)", async () => {
    route(() => problem(503, "UNKNOWN"));
    render(<App />);
    expect((await screen.findByTestId("estado-error-paginas")).getAttribute("role")).toBe("alert");
    expect(screen.queryByTestId("pagina-inicio")).toBeNull();
    expect(screen.queryByText(/SYNTH/)).toBeNull();
    expect(screen.queryByTestId("badge-demo")).toBeNull();
  });

  test("403 TENANT_MISMATCH es error, nunca dato; 404 tampoco filtra nada (tenant ajeno)", async () => {
    for (const [s, c] of [[403, "TENANT_MISMATCH"], [404, "NOT_FOUND"]] as const) {
      route(() => problem(s, c));
      const { unmount } = render(<App />);
      expect((await screen.findByTestId("estado-error-paginas")).getAttribute("role")).toBe("alert");
      expect(screen.queryByText(/SYNTH/)).toBeNull();
      unmount();
    }
  });

  test("lista vacia: aviso sin cifras", async () => {
    route(() => resp({ items: [], next_cursor: null }));
    render(<App />);
    expect(await screen.findByTestId("estado-vacio-paginas")).toBeTruthy();
  });

  test("con interruptor demo y servicio caido: badge DEMO y paginas de ejemplo", async () => {
    process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO = "1";
    route(() => resp(page), () => problem(503, "UNKNOWN"));
    query = "";
    render(<App />);
    expect(await screen.findByTestId("badge-demo")).toBeTruthy();
    expect((await screen.findByTestId("pagina-inicio")).textContent).toContain("SYNTH");
    expect(f.mock.calls.every((c) => String(c[0]).endsWith("/sites"))).toBe(true);
  });
});
