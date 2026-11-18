import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
let query = "";
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(query),
  usePathname: () => "/mi-web/paginas",
}));
import { apiFetch } from "@/lib/api/fetch-client";
import Layout from "@/app/mi-web/layout";
import PaginasPage from "@/app/mi-web/paginas/page";
import { demoPage, resetDemoPages } from "@/lib/sites/mocks/pages";
import { resp, SITE_A, TENANT, siteOk } from "./fake";

const f = apiFetch as jest.Mock;
const PAGE_ID = "00000000-0000-4000-8000-0000000000c1";
const problem = (status: number, code: string) => resp({ type: "x", title: "t", status, code }, status, "application/problem+json");
const page = {
  id: PAGE_ID, tenant_id: TENANT, vertical: "realestate", site_id: SITE_A, page_key: "inicio", status: "draft",
  slug: { es: "inicio", en: "home" }, title: { es: "SYNTH Inicio", en: "SYNTH Home" }, meta_description: { es: "SYNTH meta" },
  body: [
    { block_id: "h1", type: "hero", i18n: { headline: { es: "SYNTH Hola", en: "SYNTH Hi" } } },
    { block_id: "l1", type: "legal_broker", data: { license: "SYNTH-0" } },
    { block_id: "g1", type: "gallery", data: { n: 1 } },
  ],
};
const App = () => (
  <Layout>
    <PaginasPage />
  </Layout>
);
const patches = () => f.mock.calls.filter((c) => (c[1] as RequestInit | undefined)?.method === "PATCH");
const ENV = ["NEXT_PUBLIC_SITES_PANEL", "NEXT_PUBLIC_SITES_ALLOW_DEMO"] as const;

function route(getRes: () => Response, patchRes: () => Response = () => resp({ ...page })) {
  f.mockImplementation(async (url: string, init?: RequestInit) => {
    const u = url.split("?")[0];
    if (u.endsWith("/sites")) return resp({ items: [siteOk], next_cursor: null });
    if (u.endsWith(`/pages/${PAGE_ID}`)) return init?.method === "PATCH" ? patchRes() : getRes();
    throw new Error(`url inesperada ${u}`);
  });
}
beforeEach(() => {
  f.mockReset();
  query = `sitio=${SITE_A}&pagina=${PAGE_ID}`;
  resetDemoPages();
  for (const k of ENV) delete process.env[k];
  process.env.NEXT_PUBLIC_SITES_PANEL = "1";
});
afterAll(() => { for (const k of ENV) delete process.env[k]; });

const type = (id: string, v: string) => fireEvent.change(screen.getByTestId(id), { target: { value: v } });

describe("Mi web / Paginas: editor", () => {
  test("editar un texto ES y guardar envia PATCH solo con ese campo y sin tenant_id (positivo)", async () => {
    route(() => resp(page));
    render(<App />);
    await screen.findByTestId("editor-pagina");
    type("h1-headline-es", "SYNTH Nuevo");
    fireEvent.click(screen.getByTestId("guardar"));
    await waitFor(() => expect(patches()).toHaveLength(1));
    const [url, init] = patches()[0];
    expect(url).toContain(`/pages/${PAGE_ID}`);
    const body = JSON.parse(init.body);
    expect(Object.keys(body)).toEqual(["body"]);
    expect(body.body[0].i18n.headline).toEqual({ es: "SYNTH Nuevo", en: "SYNTH Hi" });
    expect(body.body[1]).toEqual(page.body[1]);
    expect(body.body[2]).toEqual(page.body[2]);
    expect(JSON.stringify(f.mock.calls)).not.toMatch(/tenant/i);
    expect(await screen.findByTestId("guardado")).toBeTruthy();
  });

  test("ES vacio bloquea Guardar con mensaje y no llama a la red (negativo)", async () => {
    route(() => resp(page));
    render(<App />);
    await screen.findByTestId("editor-pagina");
    const antes = f.mock.calls.length;
    type("titulo-es", "  ");
    fireEvent.click(screen.getByTestId("guardar"));
    const err = await screen.findByTestId("error-titulo-es");
    expect(err.getAttribute("role")).toBe("alert");
    expect(screen.getByTestId("titulo-es").getAttribute("aria-describedby")).toContain(err.id);
    expect(f.mock.calls.length).toBe(antes);
  });

  test("slug fuera del patron bloquea el guardado", async () => {
    route(() => resp(page));
    render(<App />);
    await screen.findByTestId("editor-pagina");
    type("slug-es", "Mala Ruta");
    fireEvent.click(screen.getByTestId("guardar"));
    expect((await screen.findByTestId("error-slug-es")).getAttribute("role")).toBe("alert");
    expect(patches()).toHaveLength(0);
  });

  test("EN vacio guarda con aviso 'se mostrara en espanol'", async () => {
    route(() => resp(page));
    render(<App />);
    await screen.findByTestId("editor-pagina");
    type("h1-headline-en", "");
    fireEvent.click(screen.getByTestId("guardar"));
    await waitFor(() => expect(patches()).toHaveLength(1));
    expect(JSON.parse(patches()[0][1].body).body[0].i18n.headline).toEqual({ es: "SYNTH Hola" });
    expect((await screen.findByTestId("aviso-ingles")).textContent).toMatch(/español/);
  });

  test("bloque legal_: solo lectura, sin campo ni borrar, y se reenvia intacto; otros tipos se listan", async () => {
    route(() => resp(page));
    render(<App />);
    await screen.findByTestId("editor-pagina");
    const legal = screen.getByTestId("bloque-legal-l1");
    expect(legal.textContent).toMatch(/Lo agrega Nadakki automáticamente/);
    expect(legal.querySelector("input,textarea,button")).toBeNull();
    expect(screen.queryByRole("button", { name: /borrar|eliminar|quitar/i })).toBeNull();
    expect(screen.getByTestId("bloque-otro-g1").textContent).toMatch(/bloque gallery/);
    type("h1-headline-es", "x");
    fireEvent.click(screen.getByTestId("guardar"));
    await waitFor(() => expect(patches()).toHaveLength(1));
    expect(JSON.parse(patches()[0][1].body).body[1]).toEqual(page.body[1]);
  });

  test("422 RESERVED_BLOCK_TYPE y 409 CONFLICT: role=alert y el texto escrito se conserva", async () => {
    for (const [s, c, re] of [[422, "RESERVED_BLOCK_TYPE", /legales/i], [409, "CONFLICT", /Otra persona/]] as const) {
      route(() => resp(page), () => problem(s, c));
      const { unmount } = render(<App />);
      await screen.findByTestId("editor-pagina");
      type("h1-headline-es", "SYNTH escrito");
      fireEvent.click(screen.getByTestId("guardar"));
      const a = await screen.findByTestId("error-guardar");
      expect(a.getAttribute("role")).toBe("alert");
      expect(a.textContent).toMatch(re);
      expect(a.textContent).not.toMatch(/RESERVED_BLOCK_TYPE|CONFLICT/);
      expect((screen.getByTestId("h1-headline-es") as HTMLInputElement).value).toBe("SYNTH escrito");
      unmount();
    }
  });

  test("getPage de otro tenant (404): 'no encontrada' sin titulo ni datos (tenant ajeno)", async () => {
    route(() => problem(404, "NOT_FOUND"));
    render(<App />);
    expect(await screen.findByTestId("estado-no-encontrada")).toBeTruthy();
    expect(screen.queryByTestId("editor-pagina")).toBeNull();
    expect(screen.queryByDisplayValue(/SYNTH/)).toBeNull();
  });

  test("403 TENANT_MISMATCH al abrir es error, nunca dato", async () => {
    route(() => problem(403, "TENANT_MISMATCH"));
    render(<App />);
    expect((await screen.findByTestId("estado-error-pagina")).getAttribute("role")).toBe("alert");
    expect(screen.queryByTestId("editor-pagina")).toBeNull();
  });

  test("cambios sin guardar: aviso al salir (beforeunload)", async () => {
    route(() => resp(page));
    render(<App />);
    await screen.findByTestId("editor-pagina");
    const limpio = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(limpio);
    expect(limpio.defaultPrevented).toBe(false);
    type("titulo-es", "SYNTH otro");
    const sucio = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(sucio);
    expect(sucio.defaultPrevented).toBe(true);
    expect(screen.getByTestId("sin-guardar")).toBeTruthy();
  });

  test("modo demo: badge DEMO y guardar no llama a la red", async () => {
    process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO = "1";
    f.mockRejectedValue(new TypeError("fetch failed"));
    query = `pagina=00000000-0000-4000-8000-0000000000e1`;
    render(<App />);
    await screen.findByTestId("editor-pagina");
    expect(screen.getAllByTestId("badge-demo").length).toBeGreaterThan(0);
    const antes = patches().length;
    type("titulo-es", "SYNTH Editado");
    fireEvent.click(screen.getByTestId("guardar"));
    expect(await screen.findByTestId("guardado")).toBeTruthy();
    expect(patches().length).toBe(antes);
    expect(demoPage("00000000-0000-4000-8000-0000000000e1")?.title?.es).toBe("SYNTH Editado");
  });
});
