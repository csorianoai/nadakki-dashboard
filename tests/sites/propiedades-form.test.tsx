import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

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
const LID = "00000000-0000-4000-8000-0000000000e1";
const ZID = "00000000-0000-4000-8000-0000000000e2";
const MID = "00000000-0000-4000-8000-0000000000e3";
const problem = (status: number, code: string) => resp({ type: "x", title: "t", status, code }, status, "application/problem+json");
const existing = { id: LID, tenant_id: TENANT, vertical: "realestate", site_id: SITE_A, slug: "casa-a", publish_state: "published", item_kind: "property", title: { es: "Casa A" }, features: [], media: [], vertical_attrs: {} };
type H = Record<string, () => Response>;
function route(h: H) {
  f.mockImplementation(async (url: string, init?: { method?: string }) => {
    const u = url.split("?")[0];
    if (u.endsWith("/api/v1/sites/sites")) return h.sites ? h.sites() : resp({ items: [siteOk], next_cursor: null });
    const key = `${init?.method ?? "GET"} ${u.replace(/^.*\/sites\/[^/]+/, "")}`;
    const fn = h[key];
    if (!fn) throw new Error(`url inesperada ${key}`);
    return fn();
  });
}
const okLists: H = {
  "GET /zones": () => resp({ items: [{ id: ZID, slug: "z", name: { es: "Piantini" } }], next_cursor: null }),
  "GET /buildings": () => resp({ items: [], next_cursor: null }),
  "GET /developments": () => resp({ items: [], next_cursor: null }),
  "GET /media": () => resp({ items: [{ id: MID, status: "approved", alt: { es: "Sala", en: "Living" } }, { id: "x2", status: "pending", alt: { es: "Pendiente", en: "Pending" } }], next_cursor: null }),
};
const App = () => (<Layout><PropiedadesPage /></Layout>);
const ENV = ["NEXT_PUBLIC_SITES_PANEL", "NEXT_PUBLIC_SITES_ALLOW_DEMO"] as const;
const sent = (m: string) => f.mock.calls.filter((c) => c[1]?.method === m);
const type = (id: string, v: string) => fireEvent.change(screen.getByTestId(id), { target: { value: v } });

beforeEach(() => {
  f.mockReset();
  query = `sitio=${SITE_A}&nueva=1`;
  resetDemoListings();
  for (const k of ENV) delete process.env[k];
  process.env.NEXT_PUBLIC_SITES_PANEL = "1";
});
afterAll(() => { for (const k of ENV) delete process.env[k]; });

describe("Mi web / Propiedades: formulario", () => {
  test("crear envia POST con Idempotency-Key, sin tenant_id ni publish_state (positivo)", async () => {
    route({ ...okLists, "POST /listings": () => resp({ ...existing, id: LID }, 201) });
    render(<App />);
    await screen.findByTestId("form-propiedad");
    type("titulo-es", "Casa nueva");
    type("slug", "casa-nueva");
    fireEvent.click(screen.getByTestId("guardar"));
    await screen.findByTestId("guardado");
    const [url, init] = sent("POST")[0];
    expect(String(url)).toContain(`/sites/${SITE_A}/listings`);
    expect(init.headers["Idempotency-Key"]).toBeTruthy();
    const body = JSON.parse(init.body);
    expect(body).toMatchObject({ slug: "casa-nueva", title: { es: "Casa nueva" } });
    expect(JSON.stringify(body)).not.toMatch(/tenant_id|publish_state/);
    expect(body.title.en).toBeUndefined();
  });
  test("titulo ES vacio no llama a fetch de escritura (negativo)", async () => {
    route({ ...okLists });
    render(<App />);
    await screen.findByTestId("form-propiedad");
    type("slug", "casa-nueva");
    fireEvent.click(screen.getByTestId("guardar"));
    const err = await screen.findByTestId("error-titulo-es");
    expect(err.getAttribute("role")).toBe("alert");
    expect(screen.getByTestId("titulo-es").getAttribute("aria-describedby")).toContain(err.id);
    expect(sent("POST")).toHaveLength(0);
  });
  test("409 CONFLICT de slug se asocia al campo con aria-describedby", async () => {
    route({ ...okLists, "POST /listings": () => problem(409, "CONFLICT") });
    render(<App />);
    await screen.findByTestId("form-propiedad");
    type("titulo-es", "Casa");
    type("slug", "casa-a");
    fireEvent.click(screen.getByTestId("guardar"));
    const err = await screen.findByTestId("error-slug");
    expect(screen.getByTestId("slug").getAttribute("aria-describedby")).toContain(err.id);
    expect(err.textContent).toMatch(/otra propiedad/i);
  });
  test("no existe control que fije publish_state ni boton Publicar", async () => {
    route({ ...okLists });
    const { container } = render(<App />);
    await screen.findByTestId("form-propiedad");
    expect(container.querySelector('[name="publish_state"],[data-testid*="publish"]')).toBeNull();
    expect(screen.queryByRole("button", { name: /publicar/i })).toBeNull();
    expect(screen.getByTestId("estado-publicacion").textContent).toMatch(/borrador/i);
  });
  test("selects de zona/edificio caidos: 'No disponible' y 0 opciones", async () => {
    route({ ...okLists, "GET /zones": () => problem(503, "UNKNOWN"), "GET /buildings": () => problem(503, "UNKNOWN") });
    render(<App />);
    await screen.findByTestId("form-propiedad");
    await waitFor(() => expect(screen.getByTestId("zona").textContent).toMatch(/No disponible/));
    for (const id of ["zona", "edificio"]) {
      expect(screen.getByTestId(id).textContent).toMatch(/No disponible/);
      expect(screen.getByTestId(id).querySelectorAll("option[value]:not([value=''])")).toHaveLength(0);
    }
    expect(screen.getByTestId("zona").querySelectorAll("option")).toHaveLength(1);
  });
  test("solo medios aprobados; attrs solo para property", async () => {
    route({ ...okLists, "POST /listings": () => resp({ ...existing }, 201) });
    render(<App />);
    await screen.findByTestId("form-propiedad");
    await screen.findByTestId(`medio-${MID}`);
    expect(screen.queryByTestId("medio-x2")).toBeNull();
    fireEvent.click(screen.getByTestId(`medio-${MID}`));
    fireEvent.click(screen.getByTestId("agregar-dato"));
    type("dato-clave-0", "habitaciones");
    type("dato-valor-0", "3");
    type("titulo-es", "Casa");
    type("slug", "casa");
    fireEvent.click(screen.getByTestId("guardar"));
    await screen.findByTestId("guardado");
    expect(JSON.parse(sent("POST")[0][1].body)).toMatchObject({ media: [MID], vertical_attrs: { habitaciones: "3" } });
    fireEvent.change(screen.getByTestId("tipo"), { target: { value: "generic" } });
    expect(screen.queryByTestId("agregar-dato")).toBeNull();
  });
  test("editar envia PATCH solo con lo cambiado", async () => {
    query = `sitio=${SITE_A}&propiedad=${LID}`;
    route({ ...okLists, [`GET /listings/${LID}`]: () => resp(existing), [`PATCH /listings/${LID}`]: () => resp({ ...existing, title: { es: "Casa B" } }) });
    render(<App />);
    await screen.findByTestId("form-propiedad");
    expect((screen.getByTestId("titulo-es") as HTMLInputElement).value).toBe("Casa A");
    expect(screen.getByTestId("estado-publicacion").textContent).toMatch(/publicada/i);
    type("titulo-es", "Casa B");
    fireEvent.click(screen.getByTestId("guardar"));
    await screen.findByTestId("guardado");
    expect(JSON.parse(sent("PATCH")[0][1].body)).toEqual({ title: { es: "Casa B" } });
  });
  test("tenant ajeno: 404 'no encontrada'; 403 TENANT_MISMATCH como error sin datos", async () => {
    query = `sitio=${SITE_A}&propiedad=${LID}`;
    route({ ...okLists, [`GET /listings/${LID}`]: () => problem(404, "NOT_FOUND") });
    const a = render(<App />);
    expect((await screen.findByTestId("estado-no-encontrada")).textContent).toMatch(/no encontrada/i);
    a.unmount();
    route({ ...okLists, [`GET /listings/${LID}`]: () => problem(403, "TENANT_MISMATCH") });
    render(<App />);
    expect((await screen.findByTestId("estado-error-propiedad")).getAttribute("role")).toBe("alert");
    expect(screen.queryByTestId("form-propiedad")).toBeNull();
  });
  test("modo demo: badge DEMO y 0 llamadas de red del formulario", async () => {
    process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO = "1";
    route({ sites: () => problem(503, "UNKNOWN") });
    query = "nueva=1";
    render(<App />);
    expect(await screen.findByTestId("badge-demo")).toBeTruthy();
    await screen.findByTestId("form-propiedad");
    type("titulo-es", "SYNTH Casa");
    type("slug", "synth-casa");
    fireEvent.click(screen.getByTestId("guardar"));
    expect((await screen.findByTestId("guardado")).textContent).toMatch(/ejemplo/i);
    expect(f.mock.calls.every((c) => String(c[0]).endsWith("/sites"))).toBe(true);
  });
});
