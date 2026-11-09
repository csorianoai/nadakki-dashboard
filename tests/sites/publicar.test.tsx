import React from "react";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(`sitio=00000000-0000-4000-8000-0000000000b1`),
  usePathname: () => "/mi-web/publicar",
}));
import { apiFetch } from "@/lib/api/fetch-client";
import Layout from "@/app/mi-web/layout";
import PublicarPage from "@/app/mi-web/publicar/page";
import { resp, SITE_A, siteOk } from "./fake";

const f = apiFetch as jest.Mock;
const problem = (status: number, code: string, extra: object = {}) =>
  resp({ type: "x", title: "t", status, code, ...extra }, status, "application/problem+json");
const V3 = [
  { rule_id: "RULE-B", severity: "block", message: "Falta el aviso legal", field: "pages[contact].body[2]" },
  { rule_id: "RULE-W", severity: "warn", message: "Descripción muy corta", field: "listings[casa]" },
  { rule_id: "RULE-I", severity: "info", message: "Puede agregar fotos", field: "media[1]" },
];
const okResult = (extra: object = {}) => ({
  site_id: SITE_A, status: "published", content_version: 4, evaluation_id: "e1", published_at: "2026-11-09T10:00:00Z", warnings: [], ...extra,
});
type H = Record<string, () => Response>;
function route(h: H, sitio: object = siteOk) {
  f.mockImplementation(async (url: string, init?: { method?: string }) => {
    const u = url.split("?")[0];
    if (u.endsWith("/api/v1/sites/sites")) return resp({ items: [sitio], next_cursor: null });
    const key = `${init?.method ?? "GET"} ${u.replace(/^.*\/sites\/[^/]+/, "")}`;
    const fn = h[key];
    if (!fn) throw new Error(`url inesperada ${key}`);
    return fn();
  });
}
const base: H = {
  "GET /pages": () => resp({ items: [{ id: "p1", page_key: "contact", tenant_id: "t", vertical: "realestate", site_id: SITE_A, status: "draft" }], next_cursor: null }),
  "GET /evaluations": () => resp({ items: [], next_cursor: null }),
};
const App = () => (<Layout><PublicarPage /></Layout>);
const ENV = ["NEXT_PUBLIC_SITES_PANEL", "NEXT_PUBLIC_SITES_ALLOW_DEMO"] as const;
const calls = (m: string, suffix: string) => f.mock.calls.filter((c) => (c[1]?.method ?? "GET") === m && String(c[0]).split("?")[0].endsWith(suffix));
const futuro = () => { const d = new Date(); d.setDate(d.getDate() + 30); return d.toISOString().slice(0, 10); };
const publicar = async () => fireEvent.click(await screen.findByRole("button", { name: "Publicar" }));

beforeEach(() => {
  f.mockReset();
  for (const k of ENV) delete process.env[k];
  process.env.NEXT_PUBLIC_SITES_PANEL = "1";
});
afterAll(() => { for (const k of ENV) delete process.env[k]; });

describe("Mi web / Publicar", () => {
  test("200 con warnings pinta publicado y los avisos (positivo)", async () => {
    route({ ...base, "POST /publish": () => resp(okResult({ warnings: [V3[1]] })) });
    render(<App />);
    await publicar();
    expect((await screen.findByTestId("resultado-publicado")).textContent).toMatch(/Publicado/);
    expect(screen.getByTestId("estado-sitio").textContent).toMatch(/Publicado/);
    expect(screen.getByTestId("resultado-avisos").textContent).toContain("Descripción muy corta");
    const [, init] = calls("POST", "/publish")[0];
    expect(init.headers["Idempotency-Key"]).toBeTruthy();
    expect(JSON.stringify(f.mock.calls)).not.toMatch(/tenant/i);
  });

  test("422 PUBLISH_BLOCKED pinta las 3 violaciones con las cuatro claves y no marca publicado (negativo)", async () => {
    route({ ...base, "POST /publish": () => problem(422, "PUBLISH_BLOCKED", { violations: V3 }) });
    render(<App />);
    await publicar();
    const filas = await screen.findAllByTestId("violacion");
    expect(filas).toHaveLength(3);
    expect(filas[0].textContent).toMatch(/Bloquea.*Falta el aviso legal.*RULE-B.*pages\[contact\]\.body\[2\]/);
    expect(filas[1].textContent).toMatch(/Aviso.*Descripción muy corta.*RULE-W.*listings\[casa\]/);
    expect(filas[2].textContent).toMatch(/Información.*Puede agregar fotos.*RULE-I.*media\[1\]/);
    expect(await screen.findByTestId("v-enlace")).toBeInTheDocument();
    expect(screen.queryByTestId("resultado-publicado")).toBeNull();
    expect(screen.getByTestId("estado-sitio").textContent).toMatch(/Borrador/);
  });

  test("solo el warn ofrece aceptar; sin justificacion y fecha futura 0 llamadas a overrides; con ellas 1", async () => {
    route({ ...base, "POST /publish": () => problem(422, "PUBLISH_BLOCKED", { violations: V3 }),
      "POST /overrides": () => resp({ id: "o1", rule_id: "RULE-W", expires_at: `${futuro()}T23:59:59Z` }) });
    render(<App />);
    await publicar();
    const filas = await screen.findAllByTestId("violacion");
    expect(within(filas[0]).queryByRole("button")).toBeNull();
    expect(within(filas[2]).queryByRole("button")).toBeNull();
    fireEvent.click(within(filas[1]).getByRole("button", { name: "Aceptar este aviso" }));
    fireEvent.click(screen.getByRole("button", { name: "Confirmar aceptación" }));
    expect(await screen.findByTestId("error-override")).toBeTruthy();
    expect(calls("POST", "/overrides")).toHaveLength(0);
    fireEvent.change(screen.getByLabelText(/Justificación/), { target: { value: "Lo revisó el equipo" } });
    fireEvent.change(screen.getByLabelText(/Vale hasta/), { target: { value: futuro() } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar aceptación" }));
    await waitFor(() => expect(calls("POST", "/overrides")).toHaveLength(1));
    expect(JSON.parse(calls("POST", "/overrides")[0][1].body)).toMatchObject({ rule_id: "RULE-W", justification: "Lo revisó el equipo" });
  });

  test("422 OVERRIDE_NOT_ALLOWED se pinta en llano", async () => {
    route({ ...base, "POST /publish": () => problem(422, "PUBLISH_BLOCKED", { violations: [V3[1]] }),
      "POST /overrides": () => problem(422, "OVERRIDE_NOT_ALLOWED") });
    render(<App />);
    await publicar();
    fireEvent.click(await screen.findByRole("button", { name: "Aceptar este aviso" }));
    fireEvent.change(screen.getByLabelText(/Justificación/), { target: { value: "x" } });
    fireEvent.change(screen.getByLabelText(/Vale hasta/), { target: { value: futuro() } });
    fireEvent.click(screen.getByRole("button", { name: "Confirmar aceptación" }));
    expect((await screen.findByTestId("error-override")).textContent).toMatch(/solo los avisos pueden aceptarse/);
  });

  test("202 pinta En revision con la regla manual y no marca publicado", async () => {
    route({ ...base, "POST /publish": () => resp(okResult({ status: "in_review", pending_manual_rules: ["MANUAL-1"] }), 202) });
    render(<App />);
    await publicar();
    const r = await screen.findByTestId("resultado-revision");
    expect(r.textContent).toMatch(/En revisión: faltan aprobaciones manuales/);
    expect(r.textContent).toContain("MANUAL-1");
    expect(screen.queryByTestId("resultado-publicado")).toBeNull();
    expect(screen.getByTestId("estado-sitio").textContent).not.toMatch(/^.*Publicado/);
  });

  test("reintentar tras un fallo de red reutiliza el mismo Idempotency-Key", async () => {
    let n = 0;
    route({ ...base, "POST /publish": () => resp(okResult()) });
    const normal = f.getMockImplementation()!;
    f.mockImplementation(async (url: string, init?: { method?: string }) => {
      if (init?.method === "POST" && n++ < 2) throw new TypeError("network");
      return normal(url, init);
    });
    render(<App />);
    await publicar();
    expect(await screen.findByRole("alert")).toHaveTextContent(/Sin conexión/);
    fireEvent.click(screen.getByRole("button", { name: "Publicar" }));
    await screen.findByTestId("resultado-publicado");
    const keys = calls("POST", "/publish").map((c) => c[1].headers["Idempotency-Key"]);
    expect(keys.length).toBeGreaterThanOrEqual(3);
    expect(new Set(keys).size).toBe(1);
  });

  test("404 NOT_FOUND (sitio de otro tenant) -> no encontrado, sin violaciones", async () => {
    route({ ...base, "POST /publish": () => problem(404, "NOT_FOUND") });
    render(<App />);
    await publicar();
    expect(await screen.findByRole("alert")).toHaveTextContent(/no encontrado/i);
    expect(screen.queryAllByTestId("violacion")).toHaveLength(0);
    expect(screen.queryByTestId("resultado-publicado")).toBeNull();
  });

  test("403 TENANT_MISMATCH es un error, nunca un dato", async () => {
    route({ ...base, "POST /publish": () => problem(403, "TENANT_MISMATCH") });
    render(<App />);
    await publicar();
    expect(await screen.findByRole("alert")).toHaveTextContent(/no corresponde a esta cuenta/);
    expect(screen.queryByTestId("resultado-publicado")).toBeNull();
  });

  test("Revisar antes de publicar usa readiness y no cambia el estado", async () => {
    route({ ...base, "GET /readiness": () => resp({ site_id: SITE_A, ready: false, blocking: [V3[0]], warnings: [V3[1]], info: [V3[2]], evaluated_at: "2026-11-09T10:00:00Z" }) });
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Revisar antes de publicar" }));
    expect(await screen.findAllByTestId("violacion")).toHaveLength(3);
    expect(screen.getByTestId("estado-sitio").textContent).toMatch(/Borrador/);
    expect(calls("POST", "/publish")).toHaveLength(0);
  });

  test("despublicar pide confirmacion y llama a unpublishSite una vez", async () => {
    route({ ...base, "POST /unpublish": () => resp(okResult({ status: "draft" })) }, { ...siteOk, status: "published" });
    render(<App />);
    fireEvent.click(await screen.findByRole("button", { name: "Despublicar" }));
    expect(calls("POST", "/unpublish")).toHaveLength(0);
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Sí, despublicar" }));
    expect(await screen.findByTestId("resultado-despublicado")).toBeInTheDocument();
    expect(calls("POST", "/unpublish")).toHaveLength(1);
    expect(screen.getByTestId("estado-sitio").textContent).toMatch(/Borrador/);
  });

  test("historial de solo lectura con resultado", async () => {
    route({ ...base, "GET /evaluations": () => resp({ items: [{ id: "e1", site_id: SITE_A, trigger: "publish", result: "block", findings: V3, created_at: "2026-11-09T10:00:00Z" }], next_cursor: null }) });
    render(<App />);
    expect((await screen.findByTestId("evaluacion")).textContent).toMatch(/Bloqueado/);
    expect(within(screen.getByTestId("historial")).queryByRole("button")).toBeNull();
  });

  test("modo DEMO: badge, y el resultado simulado no es publicacion real", async () => {
    process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO = "1";
    f.mockImplementation(async () => { throw new TypeError("network"); });
    render(<App />);
    expect(await screen.findByTestId("badge-demo")).toBeInTheDocument();
    await publicar();
    expect((await screen.findByTestId("resultado-demo")).textContent).toMatch(/Simulación en modo DEMO/);
    expect(screen.queryByTestId("resultado-publicado")).toBeNull();
    expect(calls("POST", "/publish")).toHaveLength(0);
  });
});
