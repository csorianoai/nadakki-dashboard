import React from "react";
import { render, screen, waitFor, fireEvent, within } from "@testing-library/react";

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
const page = {
  id: PAGE_ID, tenant_id: TENANT, vertical: "realestate", site_id: SITE_A, page_key: "inicio", status: "draft", sort_order: 0,
  slug: { es: "inicio", en: "home" },
  title: { es: "SYNTH Inicio", en: "SYNTH Home" },
  meta_description: { es: "SYNTH descripcion", en: "SYNTH description" },
  body: [
    { block_id: "b1", type: "hero", data: { x: 1 }, i18n: { headline: { es: "SYNTH Hola", en: "SYNTH Hello" } } },
    { block_id: "b2", type: "legal_broker", data: { license: "SYNTH-1" } },
    { block_id: "b3", type: "gallery", data: { ids: [1, 2] } },
  ],
};

type Handler = { sites?: () => Response; list?: () => Response; get?: () => Response; patch?: () => Response };
function route(h: Handler) {
  f.mockImplementation(async (url: string, init?: { method?: string }) => {
    const u = url.split("?")[0];
    if (init?.method === "PATCH") return (h.patch ?? (() => resp(page)))();
    if (/\/pages\/[^/]+$/.test(u)) return (h.get ?? (() => resp(page)))();
    if (u.endsWith("/pages")) return (h.list ?? (() => resp({ items: [page], next_cursor: null })))();
    if (u.endsWith("/sites")) return (h.sites ?? (() => resp({ items: [siteOk], next_cursor: null })))();
    throw new Error(`url inesperada ${u}`);
  });
}
const App = () => (
  <Layout>
    <PaginasPage />
  </Layout>
);
const patches = () => f.mock.calls.filter((c) => c[1]?.method === "PATCH");
const ENV = ["NEXT_PUBLIC_SITES_PANEL", "NEXT_PUBLIC_SITES_ALLOW_DEMO"] as const;
const abrir = async () => {
  query = `sitio=${SITE_A}&pagina=${PAGE_ID}`;
  render(<App />);
  return screen.findByTestId("editor-pagina");
};
const escribir = (id: string, v: string) => fireEvent.change(screen.getByTestId(id), { target: { value: v } });

beforeEach(() => {
  f.mockReset();
  query = "";
  resetDemoPages();
  for (const k of ENV) delete process.env[k];
  process.env.NEXT_PUBLIC_SITES_PANEL = "1";
});
afterAll(() => { for (const k of ENV) delete process.env[k]; });

describe("Mi web / Paginas: lista", () => {
  test("lista con page_key, titulo y estado en texto (positivo)", async () => {
    route({});
    query = `sitio=${SITE_A}`;
    render(<App />);
    const fila = await screen.findByTestId("pagina-inicio");
    expect(fila.textContent).toContain("inicio");
    expect(fila.textContent).toContain("SYNTH Inicio");
    expect(screen.getByTestId("estado-pagina-inicio").textContent).toMatch(/borrador/i);
    expect((screen.getByTestId("editar-inicio") as HTMLAnchorElement).getAttribute("href")).toBe(`/mi-web/paginas?sitio=${SITE_A}&pagina=${PAGE_ID}`);
    expect(screen.queryByTestId("badge-demo")).toBeNull();
  });

  test("servicio caido sin interruptor demo: no disponible, sin datos ni mocks (negativo)", async () => {
    route({ list: () => problem(503, "UNKNOWN") });
    query = `sitio=${SITE_A}`;
    render(<App />);
    expect((await screen.findByTestId("estado-error-paginas")).getAttribute("role")).toBe("alert");
    expect(screen.queryByTestId("pagina-inicio")).toBeNull();
    expect(screen.queryByText(/SYNTH/)).toBeNull();
    expect(screen.queryByTestId("badge-demo")).toBeNull();
  });
});

describe("Mi web / Paginas: editor", () => {
  test("editar un texto ES y guardar envia PATCH solo con ese campo y sin tenant_id (positivo)", async () => {
    route({});
    await abrir();
    escribir("campo-titulo-es", "SYNTH Inicio nuevo");
    fireEvent.click(screen.getByTestId("guardar"));
    await waitFor(() => expect(patches()).toHaveLength(1));
    const [url, init] = patches()[0];
    expect(String(url)).toMatch(new RegExp(`/pages/${PAGE_ID}$`));
    const body = JSON.parse(init.body);
    expect(Object.keys(body)).toEqual(["title"]);
    expect(body.title.es).toBe("SYNTH Inicio nuevo");
    expect(JSON.stringify([url, init])).not.toMatch(/tenant/i);
    expect((await screen.findByTestId("guardado")).textContent).toMatch(/guardado/i);
  });

  test("ES vacio bloquea el guardado, no llama a fetch y muestra el motivo (negativo)", async () => {
    route({});
    await abrir();
    const antes = f.mock.calls.length;
    escribir("campo-titulo-es", "   ");
    fireEvent.click(screen.getByTestId("guardar"));
    const input = screen.getByTestId("campo-titulo-es");
    const desc = document.getElementById(input.getAttribute("aria-describedby") ?? "");
    expect(desc?.textContent).toMatch(/obligatori/i);
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    expect(f.mock.calls.length).toBe(antes);
    expect(patches()).toHaveLength(0);
  });

  test("slug.es invalido (patron del contrato) bloquea; slug.en vacio es opcional", async () => {
    route({});
    await abrir();
    escribir("campo-slug-es", "Mala Ruta");
    fireEvent.click(screen.getByTestId("guardar"));
    expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);
    expect(patches()).toHaveLength(0);
    escribir("campo-slug-es", "buena-ruta");
    escribir("campo-slug-en", "");
    fireEvent.click(screen.getByTestId("guardar"));
    await waitFor(() => expect(patches()).toHaveLength(1));
    expect(JSON.parse(patches()[0][1].body)).toEqual({ slug: { es: "buena-ruta" } });
  });

  test("EN vacio guarda con aviso de que se mostrara en espanol", async () => {
    route({});
    await abrir();
    escribir("campo-meta-en", "");
    expect(screen.getByTestId("aviso-en").textContent).toMatch(/espa/i);
    fireEvent.click(screen.getByTestId("guardar"));
    await waitFor(() => expect(patches()).toHaveLength(1));
    expect(JSON.parse(patches()[0][1].body)).toEqual({ meta_description: { es: "SYNTH descripcion" } });
    expect((await screen.findByTestId("guardado")).textContent).toMatch(/espa/i);
  });

  test("bloque legal_: solo lectura con nota, sin campo ni boton, y se reenvia intacto junto a los demas bloques", async () => {
    route({});
    await abrir();
    const legal = screen.getByTestId("bloque-legal-b2");
    expect(legal.textContent).toMatch(/lo agrega nadakki autom/i);
    expect(within(legal).queryAllByRole("textbox")).toHaveLength(0);
    expect(within(legal).queryAllByRole("button")).toHaveLength(0);
    expect(screen.getByTestId("bloque-otro-b3").textContent).toMatch(/bloque gallery/i);
    escribir("campo-b1-headline-es", "SYNTH Hola 2");
    fireEvent.click(screen.getByTestId("guardar"));
    await waitFor(() => expect(patches()).toHaveLength(1));
    const body = JSON.parse(patches()[0][1].body);
    expect(Object.keys(body)).toEqual(["body"]);
    expect(body.body[0].i18n.headline).toEqual({ es: "SYNTH Hola 2", en: "SYNTH Hello" });
    expect(body.body[1]).toEqual(page.body[1]);
    expect(body.body[2]).toEqual(page.body[2]);
  });

  test("422 RESERVED_BLOCK_TYPE se pinta en llano con role=alert y conserva lo escrito", async () => {
    route({ patch: () => problem(422, "RESERVED_BLOCK_TYPE") });
    await abrir();
    escribir("campo-titulo-es", "Texto que no se pierde");
    fireEvent.click(screen.getByTestId("guardar"));
    const a = await screen.findByTestId("error-guardar");
    expect(a.getAttribute("role")).toBe("alert");
    expect(a.textContent).toMatch(/Nadakki/);
    expect(a.textContent).not.toMatch(/RESERVED|422/);
    expect((screen.getByTestId("campo-titulo-es") as HTMLInputElement).value).toBe("Texto que no se pierde");
  });

  test("409 CONFLICT dice que otra persona edito la pagina y conserva lo escrito", async () => {
    route({ patch: () => problem(409, "CONFLICT") });
    await abrir();
    escribir("campo-titulo-es", "Mi version");
    fireEvent.click(screen.getByTestId("guardar"));
    const a = await screen.findByTestId("error-guardar");
    expect(a.getAttribute("role")).toBe("alert");
    expect(a.textContent).toMatch(/otra persona edit/i);
    expect((screen.getByTestId("campo-titulo-es") as HTMLInputElement).value).toBe("Mi version");
  });

  test("getPage de otro tenant (404): 'no encontrada' sin titulo ni datos (tenant ajeno)", async () => {
    route({ get: () => problem(404, "NOT_FOUND") });
    query = `sitio=${SITE_A}&pagina=${PAGE_ID}`;
    render(<App />);
    expect((await screen.findByTestId("estado-no-encontrada")).textContent).toMatch(/no encontrada/i);
    expect(screen.queryByTestId("editor-pagina")).toBeNull();
    expect(screen.queryByText(/SYNTH Inicio/)).toBeNull();
  });

  test("403 TENANT_MISMATCH se muestra como error, nunca como dato (tenant ajeno)", async () => {
    route({ get: () => problem(403, "TENANT_MISMATCH") });
    query = `sitio=${SITE_A}&pagina=${PAGE_ID}`;
    render(<App />);
    expect((await screen.findByTestId("estado-error-pagina")).getAttribute("role")).toBe("alert");
    expect(screen.queryByTestId("editor-pagina")).toBeNull();
    expect(screen.queryByText(/SYNTH Inicio/)).toBeNull();
  });

  test("con cambios sin guardar avisa al salir; sin cambios no", async () => {
    route({});
    await abrir();
    const limpio = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(limpio);
    expect(limpio.defaultPrevented).toBe(false);
    escribir("campo-titulo-en", "Otro");
    const sucio = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(sucio);
    expect(sucio.defaultPrevented).toBe(true);
  });

  test("controles con etiqueta asociada", async () => {
    route({});
    await abrir();
    expect(screen.getByLabelText(/^título.*español/i)).toBe(screen.getByTestId("campo-titulo-es"));
  });
});

describe("Mi web / Paginas: demo", () => {
  test("con interruptor demo y servicio caido: badge DEMO y guardar no llama a la red", async () => {
    process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO = "1";
    route({ sites: () => problem(503, "UNKNOWN") });
    query = "";
    render(<App />);
    expect(await screen.findByTestId("badge-demo")).toBeTruthy();
    fireEvent.click(await screen.findByTestId("editar-inicio"));
    const callsAntes = f.mock.calls.length;
    const ed = await screen.findByTestId("editor-pagina").catch(() => null);
    if (!ed) throw new Error("el enlace de la lista debe abrir el editor");
    escribir("campo-titulo-es", "SYNTH editado");
    fireEvent.click(screen.getByTestId("guardar"));
    expect((await screen.findByTestId("guardado")).textContent).toMatch(/ejemplo|demo/i);
    expect(f.mock.calls.length).toBe(callsAntes);
    expect(screen.getByTestId("badge-demo")).toBeTruthy();
  });
});
