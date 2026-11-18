import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";

jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn() }));
jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(`sitio=00000000-0000-4000-8000-0000000000b1`),
  usePathname: () => "/mi-web/medios",
}));
import { apiFetch } from "@/lib/api/fetch-client";
import Layout from "@/app/mi-web/layout";
import MediosPage from "@/app/mi-web/medios/page";
import { resetDemoMedia } from "@/lib/sites/medios/mock";
import { resp, SITE_A, TENANT, siteOk } from "./fake";

const f = apiFetch as jest.Mock;
const UP = "00000000-0000-4000-8000-0000000000c1";
const MID = "00000000-0000-4000-8000-0000000000c2";
const problem = (status: number, code: string) => resp({ type: "x", title: "t", status, code }, status, "application/problem+json");
const asset = (id: string, status: string, extra: object = {}) => ({
  id, tenant_id: TENANT, vertical: "realestate", alt: { es: `Foto ${id}`, en: "Photo" }, permission_type: "owner",
  permission_date: "2026-03-01", acquired_on: "2026-03-02", status, permission_granted_by: "Ana Prueba", source: "Propietario", ...extra,
});
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
const presignOk = () => resp({ upload_id: UP, upload_url: "https://almacen.example/subida/1", method: "PUT", headers: { "x-t": "1" }, expires_at: "2099-01-01T00:00:00Z" });
const App = () => (<Layout><MediosPage /></Layout>);
const ENV = ["NEXT_PUBLIC_SITES_PANEL", "NEXT_PUBLIC_SITES_ALLOW_DEMO"] as const;
const calls = (m: string, suffix: string) => f.mock.calls.filter((c) => (c[1]?.method ?? "GET") === m && String(c[0]).split("?")[0].endsWith(suffix));
const type = (id: string, v: string) => fireEvent.change(screen.getByTestId(id), { target: { value: v } });
const gf = jest.fn();

function archivo(): File {
  const file = new File(["x"], "foto.png", { type: "image/png" });
  (file as unknown as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer = async () => new Uint8Array([1, 2, 3]).buffer;
  return file;
}
const FULL: Record<string, string> = {
  "alt-es": "Sala luminosa", "fuente": "Propietario", "licencia": "Uso en el sitio", "tipo-permiso": "own",
  "otorgado-por": "Ana Prueba", "alcance": "Sitio web", "fecha-permiso": "2026-03-01", "fecha-adquisicion": "2026-03-02",
};
function llenar(omit: string[] = [], extra: Record<string, string> = {}) {
  if (!omit.includes("archivo")) fireEvent.change(screen.getByTestId("archivo"), { target: { files: [archivo()] } });
  for (const [k, v] of Object.entries({ ...FULL, ...extra })) if (!omit.includes(k)) type(k, v);
}
async function abrir() {
  render(<App />);
  await screen.findByTestId("form-medio");
}

beforeEach(() => {
  f.mockReset();
  gf.mockReset();
  (global as unknown as { fetch: unknown }).fetch = gf;
  resetDemoMedia();
  for (const k of ENV) delete process.env[k];
  process.env.NEXT_PUBLIC_SITES_PANEL = "1";
});
afterAll(() => { for (const k of ENV) delete process.env[k]; });

const base: H = { "GET /media": () => resp({ items: [], next_cursor: null }) }; // la lista llega en la PARTE 2/2

describe("Mi web / Medios: alta con permiso", () => {
  test("flujo completo: presign, subida a upload_url y createMedia con TODOS los campos (positivo)", async () => {
    gf.mockResolvedValue(resp({}, 200));
    route({ ...base, "POST /media/presign": presignOk, "POST /media": () => resp(asset(MID, "pending"), 201) });
    await abrir();
    llenar();
    fireEvent.click(screen.getByTestId("enviar"));
    await waitFor(() => expect(calls("POST", "/media")).toHaveLength(1));
    const p = JSON.parse(calls("POST", "/media/presign")[0][1].body);
    expect(p).toMatchObject({ mime_type: "image/png", size_bytes: 1 });
    expect(p.sha256).toMatch(/^[a-f0-9]{64}$/);
    expect(gf).toHaveBeenCalledWith("https://almacen.example/subida/1", expect.objectContaining({ method: "PUT" }));
    const b = JSON.parse(calls("POST", "/media")[0][1].body);
    expect(b).toEqual({
      upload_id: UP, alt: { es: "Sala luminosa", en: "Sala luminosa" }, source: "Propietario", license: "Uso en el sitio", permission_type: "own",
      permission_granted_by: "Ana Prueba", permission_scope: "Sitio web", permission_date: "2026-03-01", acquired_on: "2026-03-02",
    });
    expect(JSON.stringify(f.mock.calls)).not.toContain("tenant_id");
    expect(calls("POST", "/media")[0][1].headers["Idempotency-Key"]).toBeTruthy();
    expect(await screen.findByTestId("medio-enviado")).toBeInTheDocument();
  });

  test("el formulario avisa que sin registro de permiso la imagen se descarta a las 24 h", async () => {
    route(base);
    await abrir();
    expect(screen.getByTestId("aviso-24h").textContent).toMatch(/24 h/);
  });

  test.each(Object.keys(FULL).map((k) => [k]))("campo obligatorio vacio: %s bloquea el envio (negativo)", async (campo) => {
    route({ ...base, "POST /media/presign": presignOk, "POST /media": () => resp(asset(MID, "pending"), 201) });
    await abrir();
    llenar([campo]);
    expect(screen.getByTestId("enviar")).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByTestId("motivo-envio")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("enviar"));
    expect(await screen.findByTestId(`error-${campo}`)).toHaveAttribute("role", "alert");
    expect(screen.getByTestId(campo)).toHaveAttribute("aria-describedby", expect.stringContaining(`err-${campo}`));
    expect(document.activeElement).toBe(screen.getByTestId(campo));
    expect(calls("POST", "/media")).toHaveLength(0);
    expect(calls("POST", "/media/presign")).toHaveLength(0);
    expect(gf).not.toHaveBeenCalled();
  });

  test("sin archivo bloquea el envio (negativo)", async () => {
    route(base);
    await abrir();
    llenar(["archivo"]);
    fireEvent.click(screen.getByTestId("enviar"));
    expect(await screen.findByTestId("error-archivo")).toBeInTheDocument();
    expect(calls("POST", "/media/presign")).toHaveLength(0);
  });

  test.each(["developer", "owner"])("%s sin evidencia bloquea; con evidencia se envia", async (tp) => {
    gf.mockResolvedValue(resp({}, 200));
    route({ ...base, "POST /media/presign": presignOk, "POST /media": () => resp(asset(MID, "pending"), 201) });
    await abrir();
    llenar([], { "tipo-permiso": tp });
    fireEvent.click(screen.getByTestId("enviar"));
    expect(await screen.findByTestId("error-evidencia")).toBeInTheDocument();
    expect(calls("POST", "/media")).toHaveLength(0);
    type("evidencia", "Correo del 1 de marzo");
    fireEvent.click(screen.getByTestId("enviar"));
    await waitFor(() => expect(calls("POST", "/media")).toHaveLength(1));
    expect(JSON.parse(calls("POST", "/media")[0][1].body).permission_evidence).toBe("Correo del 1 de marzo");
  });

  test("evidencia de mas de 500 caracteres bloquea (negativo)", async () => {
    route(base);
    await abrir();
    llenar([], { "tipo-permiso": "owner", evidencia: "x".repeat(501) });
    fireEvent.click(screen.getByTestId("enviar"));
    expect(await screen.findByTestId("error-evidencia")).toBeInTheDocument();
    expect(calls("POST", "/media/presign")).toHaveLength(0);
  });

  test("permission_date futura bloquea (negativo)", async () => {
    route(base);
    await abrir();
    llenar([], { "fecha-permiso": "2999-01-01" });
    fireEvent.click(screen.getByTestId("enviar"));
    expect(await screen.findByTestId("error-fecha-permiso")).toBeInTheDocument();
    expect(calls("POST", "/media/presign")).toHaveLength(0);
  });

  test("fallo de la subida: mensaje recuperable y 0 llamadas a createMedia", async () => {
    gf.mockRejectedValue(new TypeError("blocked by CSP"));
    route({ ...base, "POST /media/presign": presignOk, "POST /media": () => resp(asset(MID, "pending"), 201) });
    await abrir();
    llenar();
    fireEvent.click(screen.getByTestId("enviar"));
    const e = await screen.findByTestId("error-subida");
    expect(e).toHaveAttribute("role", "alert");
    expect(e.textContent).toMatch(/No se pudo subir la imagen, intenta de nuevo/);
    expect(calls("POST", "/media")).toHaveLength(0);
    expect(screen.getByTestId("enviar")).not.toHaveAttribute("aria-disabled", "true");
  });

  test("subida con respuesta no exitosa tambien es error recuperable", async () => {
    gf.mockResolvedValue(resp({}, 403));
    route({ ...base, "POST /media/presign": presignOk, "POST /media": () => resp(asset(MID, "pending"), 201) });
    await abrir();
    llenar();
    fireEvent.click(screen.getByTestId("enviar"));
    expect(await screen.findByTestId("error-subida")).toBeInTheDocument();
    expect(calls("POST", "/media")).toHaveLength(0);
  });

  test("422 IMAGE_PERMISSION_REQUIRED del servidor se muestra en llano, sin el codigo", async () => {
    gf.mockResolvedValue(resp({}, 200));
    route({ ...base, "POST /media/presign": presignOk, "POST /media": () => problem(422, "IMAGE_PERMISSION_REQUIRED") });
    await abrir();
    llenar();
    fireEvent.click(screen.getByTestId("enviar"));
    const e = await screen.findByTestId("error-envio");
    expect(e).toHaveAttribute("role", "alert");
    expect(e.textContent).toMatch(/permiso/i);
    expect(e.textContent).not.toMatch(/IMAGE_PERMISSION_REQUIRED/);
  });

  test("tenant ajeno: 403 TENANT_MISMATCH como error llano; 404 como 'no encontrado'; sin createMedia", async () => {
    for (const [st, code, re] of [[403, "TENANT_MISMATCH", /no tiene acceso/i], [404, "NOT_FOUND", /no encontrado/i]] as const) {
      f.mockReset(); gf.mockReset();
      gf.mockResolvedValue(resp({}, 200));
      route({ ...base, "POST /media/presign": () => problem(st, code), "POST /media": () => resp(asset(MID, "pending"), 201) });
      const r = render(<App />);
      await screen.findByTestId("form-medio");
      llenar();
      fireEvent.click(screen.getByTestId("enviar"));
      const e = await screen.findByTestId("error-envio");
      expect(e).toHaveAttribute("role", "alert");
      expect(e.textContent).toMatch(re);
      expect(e.textContent).not.toContain(code);
      expect(screen.queryByTestId("medio-enviado")).toBeNull();
      expect(calls("POST", "/media")).toHaveLength(0);
      expect(gf).not.toHaveBeenCalled();
      r.unmount();
    }
  });
});

describe("Mi web / Medios: modo demo", () => {
  test("badge DEMO y la subida no toca la red", async () => {
    process.env.NEXT_PUBLIC_SITES_ALLOW_DEMO = "1";
    f.mockImplementation(async () => { throw new Error("sin red"); });
    render(<App />);
    expect(await screen.findByTestId("badge-demo")).toBeInTheDocument();
    await screen.findByTestId("form-medio");
    const antes = f.mock.calls.length;
    llenar();
    await act(async () => { fireEvent.click(screen.getByTestId("enviar")); });
    expect(await screen.findByTestId("medio-enviado")).toBeInTheDocument();
    expect(f.mock.calls.length).toBe(antes);
    expect(gf).not.toHaveBeenCalled();
  });
});
