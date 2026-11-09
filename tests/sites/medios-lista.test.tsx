import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(`sitio=00000000-0000-4000-8000-0000000000b1`),
  usePathname: () => "/mi-web/medios",
}));
import { apiFetch } from "@/lib/api/fetch-client";
import Layout from "@/app/mi-web/layout";
import MediosPage from "@/app/mi-web/medios/page";
import { resetDemoMedia, saveDemoMedia } from "@/lib/sites/medios/mock";
import { resp, TENANT, siteOk } from "./fake";

const f = apiFetch as jest.Mock;
const problem = (status: number, code: string) => resp({ type: "x", title: "t", status, code }, status, "application/problem+json");
const asset = (id: string, status: string, extra: object = {}) => ({
  id, tenant_id: TENANT, vertical: "realestate", alt: { es: `Foto ${id}`, en: "Photo" }, permission_type: "owner",
  permission_date: "2026-03-01", acquired_on: "2026-03-02", status, permission_granted_by: "Ana Prueba", source: "Propietario",
  license: "Uso en el sitio", permission_scope: "Sitio web", permission_evidence: "Correo del 1 de marzo", ...extra,
});
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
const App = () => (<Layout><MediosPage /></Layout>);
const ENV = ["NEXT_PUBLIC_SITES_PANEL", "NEXT_PUBLIC_SITES_ALLOW_DEMO"] as const;
const calls = (m: string, suffix: string) => f.mock.calls.filter((c) => (c[1]?.method ?? "GET") === m && String(c[0]).split("?")[0].endsWith(suffix));
const LISTA = () => resp({ items: [asset("m1", "approved"), asset("m2", "pending"), asset("m3", "revoked", { permission_granted_by: "Luis Prueba" })], next_cursor: null });

beforeEach(() => {
  f.mockReset();
  resetDemoMedia();
  for (const k of ENV) delete process.env[k];
  process.env.NEXT_PUBLIC_SITES_PANEL = "1";
});
afterAll(() => { for (const k of ENV) delete process.env[k]; });

describe("Mi web / Medios: lista", () => {
  test("estado en texto, quien dio el permiso y fecha; solo lo aprobado es publicable (positivo)", async () => {
    route({ "GET /media": LISTA });
    render(<App />);
    const m1 = await screen.findByTestId("medio-m1");
    expect(m1.textContent).toMatch(/aprobado/i);
    expect(m1.textContent).toContain("Ana Prueba");
    expect(m1.textContent).toContain("2026-03-01");
    expect(within(m1).getByTestId("publicable-m1").textContent).toMatch(/^publicable/i);
    expect(screen.getByTestId("estado-m2").textContent).toMatch(/pendiente/i);
    expect(screen.getByTestId("publicable-m2").textContent).toMatch(/no publicable/i);
    expect(screen.getByTestId("estado-m3").textContent).toMatch(/revocado/i);
    expect(screen.getByTestId("publicable-m3").textContent).toMatch(/no publicable/i);
    expect(screen.getByTestId("medio-m3").textContent).toContain("Luis Prueba");
    expect(screen.queryByTestId("revocar-m3")).toBeNull(); // ya revocado
    expect(screen.queryByText(/aprobar/i)).toBeNull();
    expect(screen.queryByRole("button", { name: /aprobar/i })).toBeNull();
    expect(JSON.stringify(f.mock.calls)).not.toMatch(/tenant/i);
  });

  test("revocar pide confirmacion y llama a revokeMedia una vez", async () => {
    route({
      "GET /media": LISTA,
      "POST /media/m1/revoke": () => resp(asset("m1", "revoked")),
    });
    render(<App />);
    fireEvent.click(await screen.findByTestId("revocar-m1"));
    expect(calls("POST", "/media/m1/revoke")).toHaveLength(0);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("confirmar-revocar"));
    await waitFor(() => expect(calls("POST", "/media/m1/revoke")).toHaveLength(1));
    expect(JSON.parse(calls("POST", "/media/m1/revoke")[0][1].body)).toEqual({ reason: "permission_withdrawn" });
    await waitFor(() => expect(screen.getByTestId("estado-m1").textContent).toMatch(/revocado/i));
    expect(screen.getByTestId("publicable-m1").textContent).toMatch(/no publicable/i);
  });

  test("cancelar la confirmacion no revoca (negativo)", async () => {
    route({ "GET /media": LISTA });
    render(<App />);
    fireEvent.click(await screen.findByTestId("revocar-m1"));
    fireEvent.click(screen.getByTestId("cancelar-revocar"));
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(calls("POST", "/media/m1/revoke")).toHaveLength(0);
  });

  test("revocar un medio de otro tenant (404) se muestra como no encontrado", async () => {
    route({ "GET /media": LISTA, "POST /media/m1/revoke": () => problem(404, "NOT_FOUND") });
    render(<App />);
    fireEvent.click(await screen.findByTestId("revocar-m1"));
    fireEvent.click(screen.getByTestId("confirmar-revocar"));
    expect((await screen.findByTestId("error-accion")).textContent).toMatch(/no encontrado/i);
    expect(screen.getByTestId("estado-m1").textContent).toMatch(/aprobado/i);
  });

  test("editar metadatos llama a updateMedia con los campos y sin tenant", async () => {
    route({ "GET /media": LISTA, "PATCH /media/m2": () => resp(asset("m2", "pending", { source: "Nueva fuente" })) });
    render(<App />);
    fireEvent.click(await screen.findByTestId("editar-m2"));
    const fuente = screen.getByTestId("edit-fuente") as HTMLInputElement;
    expect(fuente.value).toBe("Propietario");
    fireEvent.change(fuente, { target: { value: "Nueva fuente" } });
    fireEvent.click(screen.getByTestId("guardar-edicion"));
    await waitFor(() => expect(calls("PATCH", "/media/m2")).toHaveLength(1));
    const b = JSON.parse(calls("PATCH", "/media/m2")[0][1].body);
    expect(b.source).toBe("Nueva fuente");
    expect(b.permission_granted_by).toBe("Ana Prueba");
    expect(JSON.stringify(b)).not.toContain("tenant");
  });

  test("editar con la fuente vacia bloquea el guardado (negativo)", async () => {
    route({ "GET /media": LISTA });
    render(<App />);
    fireEvent.click(await screen.findByTestId("editar-m2"));
    fireEvent.change(screen.getByTestId("edit-fuente"), { target: { value: " " } });
    fireEvent.click(screen.getByTestId("guardar-edicion"));
    expect(screen.getByTestId("edit-error-fuente")).toHaveAttribute("role", "alert");
    expect(calls("PATCH", "/media/m2")).toHaveLength(0);
  });

  test("listMedia de otro tenant (404) -> no encontrado, sin metadatos", async () => {
    route({ "GET /media": () => problem(404, "NOT_FOUND") });
    render(<App />);
    const e = await screen.findByTestId("estado-error-medios");
    expect(e.textContent).toMatch(/no encontrado/i);
    expect(screen.queryByTestId("lista-medios")).toBeNull();
    expect(document.body.textContent).not.toContain("Ana Prueba");
  });

  test("403 TENANT_MISMATCH se muestra como error, nunca como dato", async () => {
    route({ "GET /media": () => problem(403, "TENANT_MISMATCH") });
    render(<App />);
    const e = await screen.findByTestId("estado-error-medios");
    expect(e).toHaveAttribute("role", "alert");
    expect(e.textContent).toMatch(/sesión no tiene acceso/i);
    expect(screen.queryByTestId("medio-m1")).toBeNull();
  });

  test("503 sin interruptor demo: no disponible, sin datos de ejemplo", async () => {
    route({ "GET /media": () => problem(503, "UNAVAILABLE") });
    render(<App />);
    expect(await screen.findByTestId("estado-error-medios")).toBeInTheDocument();
    expect(screen.queryByTestId("badge-demo")).toBeNull();
    expect(screen.queryByTestId("lista-medios")).toBeNull();
  });

  test("modo demo: badge DEMO, lista desde memoria y sin tocar la red", async () => {
    process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO = "1";
    saveDemoMedia(asset("d1", "pending") as never);
    f.mockImplementation(async () => { throw new Error("sin red"); });
    render(<App />);
    expect(await screen.findByTestId("badge-demo")).toBeInTheDocument();
    expect(await screen.findByTestId("medio-d1")).toBeInTheDocument();
    const antes = f.mock.calls.length;
    fireEvent.click(screen.getByTestId("revocar-d1"));
    fireEvent.click(screen.getByTestId("confirmar-revocar"));
    await waitFor(() => expect(screen.getByTestId("estado-d1").textContent).toMatch(/revocado/i));
    expect(f.mock.calls.length).toBe(antes);
  });
});
