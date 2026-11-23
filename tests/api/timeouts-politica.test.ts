/**
 * @jest-environment node
 */

/**
 * Politica de topes (lib/api/timeouts.ts): lecturas cortas, reportes/descargas/subidas largas, escrituras sin corte a ciegas.
 * Las rutas son las REALES que el auditor de dash#1149 senalo como descargas GET por el BFF.
 */
import { NextRequest } from "next/server";

const BACKEND = "https://api.nadakki.test";
process.env.BACKEND_URL = BACKEND;
process.env.NEXT_PUBLIC_BACKEND_URL = BACKEND;

const mockExp = Math.floor(Date.now() / 1000) + 3600;
const TOKEN = `h.${Buffer.from(JSON.stringify({ exp: mockExp })).toString("base64url")}.s`;
jest.mock("@/lib/auth/token-storage", () => ({
  tokenStorage: { getAccessToken: () => TOKEN, getRefreshToken: () => null },
}));

import { GET } from "@/app/api/v1/[[...path]]/route";
import { apiFetch } from "@/lib/api/fetch-client";
import { fetchWithFallback } from "@/lib/api/client";
import {
  MS_ESCRITURA_CLIENTE,
  MS_LARGA_BFF,
  MS_LARGA_CLIENTE,
  MS_LECTURA_BFF,
  MS_LECTURA_CLIENTE,
  esRutaLarga,
  topeBffMs,
  topeClienteMs,
} from "@/lib/api/timeouts";

const LARGAS = [
  "/api/v1/sic/reportes/exportaciones/csv",
  "/api/v1/sic/reportes/exportaciones/pdf",
  "/api/v1/proyectos/documentos/d1/download",
  "/documents/d1/download",
  "/api/v1/bank/applications/a1/stipulations/s1/document?token=x",
  "/api/v1/contable/reports/libro-diario",
  "/api/v1/autos/vehicles/v1/photos",
  "/api/v2/credit/bank/export/queue.xlsx",
];
const CORTAS = [
  "/api/v1/advertising/dashboard",
  "/api/v1/autos/vehicles/search",
  "/api/v1/tenants/t1/google-ads/metrics?customer_id=1234567890",
  "/api/v1/autos/vehicles/v1/costs",
  "/api/v1/ops/google-ads-agent/checks/latest",
];

describe("clasificacion de rutas", () => {
  it.each(LARGAS)("larga: %s", (r) => expect(esRutaLarga(r)).toBe(true));
  it.each(CORTAS)("corta: %s", (r) => expect(esRutaLarga(r)).toBe(false));
});

describe("topes", () => {
  it("BFF: lecturas 20 s, largas 120 s, escrituras sin tope", () => {
    expect(topeBffMs("GET", "advertising/dashboard")).toBe(MS_LECTURA_BFF);
    expect(topeBffMs("GET", "sic/reportes/exportaciones/csv")).toBe(MS_LARGA_BFF);
    expect(topeBffMs("POST", "autos/dealers/d1/vehicles")).toBeNull();
    expect(topeBffMs("POST", "autos/vehicles/v1/photos")).toBeNull();
  });
  it("cliente: siempre mayor que el BFF de la misma ruta", () => {
    expect(topeClienteMs("GET", "/api/v1/advertising/dashboard")).toBe(MS_LECTURA_CLIENTE);
    expect(MS_LECTURA_CLIENTE).toBeGreaterThan(MS_LECTURA_BFF);
    expect(topeClienteMs("GET", "/api/v1/sic/reportes/exportaciones/csv")).toBe(MS_LARGA_CLIENTE);
    expect(MS_LARGA_CLIENTE).toBeGreaterThan(MS_LARGA_BFF);
    expect(topeClienteMs("POST", "/api/v1/autos/vehicles/v1/costs", "{}")).toBe(MS_ESCRITURA_CLIENTE);
    expect(topeClienteMs("POST", "/api/v1/algo", new FormData())).toBe(MS_LARGA_CLIENTE);
    expect(topeClienteMs("POST", "/api/v1/autos/vehicles/v1/photos", "x")).toBe(MS_LARGA_CLIENTE);
  });
});

/** fetch que no contesta y rechaza con AbortError al cancelar la senal. */
function colgado() {
  const fn = jest.fn((_u: unknown, init?: RequestInit) =>
    new Promise((_ok, fallo) => {
      init?.signal?.addEventListener("abort", () => {
        const e = new Error("aborted");
        e.name = "AbortError";
        fallo(e);
      });
    }),
  );
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
});

describe("BFF: un reporte largo no se corta a los 20 s", () => {
  const ctx = (path: string[]) => ({ params: Promise.resolve({ path }) });
  const peticion = (p: string) =>
    new NextRequest(`https://dashboard.nadakki.test/api/v1/${p}`, { method: "GET", headers: { Authorization: "Bearer t" } });

  it("sic/reportes/exportaciones/csv sigue vivo a los 100 s y muere a los 121 s", async () => {
    colgado();
    let terminado = false;
    const p = GET(peticion("sic/reportes/exportaciones/csv"), ctx(["sic", "reportes", "exportaciones", "csv"])).then((r) => {
      terminado = true;
      return r;
    });
    await jest.advanceTimersByTimeAsync(100_000);
    expect(terminado).toBe(false);
    await jest.advanceTimersByTimeAsync(21_000);
    const r = await p;
    expect(r.status).toBe(504);
    expect(await r.json()).toMatchObject({ error: "upstream_timeout", timeout_ms: MS_LARGA_BFF });
  });
});

describe("apiFetch", () => {
  it("GET colgado -> 504 client_timeout a los 25 s, sin maybe_completed", async () => {
    colgado();
    const p = apiFetch("/api/v1/advertising/dashboard");
    await jest.advanceTimersByTimeAsync(MS_LECTURA_CLIENTE + 1);
    const r = await p;
    expect(r.status).toBe(504);
    expect(await r.json()).toEqual({ error: "client_timeout", timeout_ms: MS_LECTURA_CLIENTE, maybe_completed: false });
  });

  it("escritura comun -> 504 a los 60 s y avisa que pudo completarse", async () => {
    colgado();
    const p = apiFetch("/api/v1/autos/vehicles/v1/costs", { method: "POST", body: "{}" });
    await jest.advanceTimersByTimeAsync(MS_ESCRITURA_CLIENTE + 1);
    expect(await (await p).json()).toMatchObject({ error: "client_timeout", maybe_completed: true });
  });

  it("subida (FormData) sigue viva a los 100 s y se corta a los 131 s", async () => {
    colgado();
    let terminado = false;
    const p = apiFetch("/api/v1/autos/vehicles/v1/photos", { method: "POST", body: new FormData() }).then((r) => {
      terminado = true;
      return r;
    });
    await jest.advanceTimersByTimeAsync(100_000);
    expect(terminado).toBe(false);
    await jest.advanceTimersByTimeAsync(31_000);
    expect((await p).status).toBe(504);
  });

  it("timeoutMs: 0 lo desactiva", async () => {
    colgado();
    let terminado = false;
    void apiFetch("/api/v1/algo", { timeoutMs: 0 }).then(() => (terminado = true));
    await jest.advanceTimersByTimeAsync(10 * 60_000);
    expect(terminado).toBe(false);
  });

  it("una respuesta a tiempo deja el temporizador limpio (la lectura del cuerpo no muere)", async () => {
    global.fetch = jest.fn().mockResolvedValue(new Response("x".repeat(10), { status: 200 })) as unknown as typeof fetch;
    const r = await apiFetch("/api/v1/sic/reportes/exportaciones/csv");
    expect(r.status).toBe(200);
    expect(jest.getTimerCount()).toBe(0);
  });

  it("una senal externa abortada sigue lanzando AbortError, no 504", async () => {
    colgado();
    const ext = new AbortController();
    const p = apiFetch("/api/v1/algo", { signal: ext.signal });
    ext.abort();
    await expect(p).rejects.toMatchObject({ name: "AbortError" });
  });

  it("el 401 con renovacion no se rompe: la llamada de reintento conserva la politica", async () => {
    const f = jest.fn().mockResolvedValue(new Response("{}", { status: 200 }));
    global.fetch = f as unknown as typeof fetch;
    await apiFetch("/api/v1/algo");
    expect(f).toHaveBeenCalledTimes(1);
    expect((f.mock.calls[0]?.[1] as RequestInit).signal).toBeDefined();
  });
});

describe("fetchWithFallback respeta la politica", () => {
  it("una descarga GET larga no se corta a los 25 s", async () => {
    colgado();
    let terminado = false;
    void fetchWithFallback("/api/v1/sic/reportes/exportaciones/csv", { fallbackData: null }).then(() => (terminado = true));
    await jest.advanceTimersByTimeAsync(100_000);
    expect(terminado).toBe(false);
  });
});
