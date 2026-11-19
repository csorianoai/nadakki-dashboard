import React from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("next/navigation", () => ({ useSearchParams: () => new URLSearchParams(""), usePathname: () => "/mi-web" }));
import { apiFetch } from "@/lib/api/fetch-client";
import Layout from "@/app/mi-web/layout";
import Page from "@/app/mi-web/page";
import { resp, SITE_A, siteOk } from "./fake";

const f = apiFetch as jest.Mock;
const problem = (status: number, extra: object = {}) => resp({ type: "x", title: "t", status, code: "VALIDATION_ERROR", ...extra }, status, "application/problem+json");
const vacio = { crear: 0, actualizar: 0, sin_cambios: 0, errores: [] };
const informe = (dry: boolean, listings: object = {}) => ({ dry_run: dry, zones: vacio, buildings: vacio, developments: vacio, listings: { ...vacio, ...listings } });
const PORTAL = { format: "nadakki-portal-v1", source: { portal: "baylara", commit: "abc" }, listings: [{ external_ref: "casa-1", title: { es: "SECRETO-NO-MOSTRAR" } }] };
const archivo = (txt: string, name = "p.json") => new File([txt], name, { type: "application/json" });
const imports = () => f.mock.calls.filter((c) => String(c[0]).includes("/import"));
const ENV = ["NEXT_PUBLIC_SITES_PANEL", "NEXT_PUBLIC_SITES_ALLOW_DEMO"] as const;

let importar: () => Response;
beforeEach(() => {
  f.mockReset();
  for (const k of ENV) delete process.env[k];
  process.env.NEXT_PUBLIC_SITES_PANEL = "1";
  importar = () => resp(informe(true, { crear: 1 }));
  f.mockImplementation(async (url: string) => {
    const u = url.split("?")[0];
    if (u.endsWith("/api/v1/sites/sites")) return resp({ items: [siteOk], next_cursor: null });
    if (u.endsWith(`/sites/${SITE_A}`)) return resp(siteOk);
    if (u.endsWith("/readiness")) return resp({ site_id: SITE_A, ready: true, evaluated_at: "2026-10-01T10:00:00Z", blocking: [], warnings: [], info: [] });
    if (u.endsWith("/import")) return importar();
    throw new Error(`url inesperada ${url}`);
  });
});
afterAll(() => { for (const k of ENV) delete process.env[k]; });

async function abrir(txt: string, size?: number) {
  render(<Layout><Page /></Layout>);
  fireEvent.click(await screen.findByTestId("conectar-portal-abrir"));
  const input = await screen.findByTestId("importar-archivo");
  const file = archivo(txt);
  if (size) Object.defineProperty(file, "size", { value: size });
  fireEvent.change(input, { target: { files: [file] } });
}

describe("Mi web / Conectar tu portal", () => {
  test("dry_run=true muestra el informe por recurso sin el contenido", async () => {
    await abrir(JSON.stringify(PORTAL));
    await screen.findByTestId("importar-informe");
    expect(screen.getByTestId("informe-listings").textContent).toContain("1");
    expect(document.body.textContent).not.toContain("SECRETO-NO-MOSTRAR");
    expect(imports()).toHaveLength(1);
    expect(String(imports()[0][0])).toContain("dry_run=true");
    expect(imports()[0][1].headers["Idempotency-Key"]).toBeTruthy();
    expect((screen.getByTestId("importar-boton") as HTMLButtonElement).disabled).toBe(false);
  });

  test("con errores (422 con report) muestra external_ref y campo y deshabilita Importar", async () => {
    importar = () => problem(422, { report: informe(true, { errores: [{ external_ref: "casa-1", campo: "title", codigo: "VALIDATION_ERROR" }] }) });
    await abrir(JSON.stringify(PORTAL));
    expect((await screen.findByTestId("informe-errores")).textContent).toMatch(/casa-1.*title/);
    expect((screen.getByTestId("importar-boton") as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByTestId("importar-boton"));
    expect(screen.queryByTestId("importar-confirmar")).toBeNull();
  });

  test("Importar pide confirmacion, llama con dry_run=false y enlaza a desarrollos y propiedades", async () => {
    await abrir(JSON.stringify(PORTAL));
    fireEvent.click(await screen.findByTestId("importar-boton"));
    expect(imports()).toHaveLength(1); // aun sin confirmar
    importar = () => resp(informe(false, { crear: 1 }));
    fireEvent.click(await screen.findByTestId("importar-si"));
    await screen.findByTestId("importar-hecho");
    expect(String(imports()[1][0])).toContain("dry_run=false");
    expect(screen.getByTestId("ir-desarrollos").getAttribute("href")).toMatch(/^\/mi-web\/desarrollos/);
    expect(screen.getByTestId("ir-propiedades").getAttribute("href")).toMatch(/^\/mi-web\/propiedades/);
  });

  test("la Idempotency-Key no se reutiliza entre intentos distintos", async () => {
    await abrir(JSON.stringify(PORTAL));
    await screen.findByTestId("importar-informe");
    fireEvent.change(screen.getByTestId("importar-archivo"), { target: { files: [archivo(JSON.stringify(PORTAL))] } });
    await waitFor(() => expect(imports()).toHaveLength(2));
    await screen.findByTestId("importar-boton");
    fireEvent.click(screen.getByTestId("importar-boton"));
    fireEvent.click(await screen.findByTestId("importar-si"));
    await waitFor(() => expect(imports()).toHaveLength(3));
    const keys = imports().map((c) => c[1].headers["Idempotency-Key"]);
    expect(new Set(keys).size).toBe(3);
  });

  test.each([["json roto", "{no", undefined, "importar-error"], ["formato ajeno", JSON.stringify({ format: "otro" }), undefined, "importar-error"], ["mas de 2 MB", "{}", 2 * 1024 * 1024 + 1, "importar-error"]])(
    "archivo invalido (%s) no llama al backend", async (_n, txt, size, id) => {
      await abrir(txt as string, size as number | undefined);
      await screen.findByTestId(id as string);
      expect(imports()).toHaveLength(0);
      expect(screen.queryByTestId("importar-boton")).toBeNull();
    });

  test.each([[401], [403], [404], [413], [422], [503]])("backend %i: mensaje claro sin detalle tecnico", async (status) => {
    importar = () => problem(status, { detail: "TRACEBACK psycopg2 interno" });
    await abrir(JSON.stringify(PORTAL));
    const e = await screen.findByTestId("importar-error");
    expect(e.textContent).not.toMatch(/TRACEBACK|psycopg2|HTTP/);
    expect(e.textContent!.length).toBeGreaterThan(20);
    expect(screen.queryByTestId("importar-boton")).toBeNull();
  });

  test("DEMO: badge, informe de ejemplo y ninguna llamada de importacion", async () => {
    process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO = "1";
    f.mockImplementation(async () => { throw new Error("sin backend"); });
    await abrir(JSON.stringify(PORTAL));
    await screen.findByTestId("importar-informe");
    expect(screen.getAllByTestId("badge-demo").length).toBeGreaterThan(0);
    expect(screen.getByTestId("importar-demo")).toBeTruthy();
    fireEvent.click(screen.getByTestId("importar-boton"));
    fireEvent.click(await screen.findByTestId("importar-si"));
    await screen.findByTestId("importar-hecho");
    expect(imports()).toHaveLength(0);
  });
});
