/**
 * @jest-environment node
 */

/**
 * Una lectura que el backend no contesta ya no deja el panel en «Cargando…» para siempre.
 *
 * Medido el 8-nov: /advertising/google-ads quedaba en «FALLBACK / Cargando…» con `/api/v1/advertising/dashboard` sin
 * respuesta >40 s, mientras Render (Cowork) mostraba 5/5 respuestas 200 en 10-251 ms: la espera estaba entre el navegador y el
 * backend. Causas leidas en el codigo:
 *   - app/api/v1/[[...path]]/route.ts: `fetch(target, ...)` sin senal ni tope;
 *   - lib/api/client.ts `fetchWithFallback`: `fetch(..., {signal})` con el `signal` que NUNCA le pasa useFetchWithFallback, y
 *     «sin reintentos»: `loading` no volvia a false.
 * Aqui: el BFF corta las LECTURAS a los 20 s con 504 `upstream_timeout`; el cliente corta a los 25 s y devuelve el fallback con
 * error "Timeout". Las escrituras no llevan tope (reportes y subidas).
 */
import { NextRequest } from "next/server";

const BACKEND = "https://api.nadakki.test";
process.env.BACKEND_URL = BACKEND;
process.env.NEXT_PUBLIC_BACKEND_URL = BACKEND;

import { GET, POST } from "@/app/api/v1/[[...path]]/route";
import { fetchWithFallback, FETCH_TIMEOUT_MS_DEFAULT } from "@/lib/api/client";

/** fetch que no contesta nunca y rechaza con AbortError cuando le cancelan la senal. */
function fetchColgado() {
  const fn = jest.fn((_url: unknown, init?: RequestInit) => {
    return new Promise((_ok, fallo) => {
      init?.signal?.addEventListener("abort", () => {
        const e = new Error("aborted");
        e.name = "AbortError";
        fallo(e);
      });
    });
  });
  global.fetch = fn as unknown as typeof fetch;
  return fn;
}

const ctx = (path: string[]) => ({ params: Promise.resolve({ path }) });
const peticion = (m: string, p: string) =>
  new NextRequest(`https://dashboard.nadakki.test/api/v1/${p}`, { method: m, headers: { Authorization: "Bearer t" } });

beforeEach(() => jest.useFakeTimers());
afterEach(() => {
  jest.useRealTimers();
  jest.resetAllMocks();
});

describe("BFF: tope de 20 s en lecturas", () => {
  it("un GET sin respuesta del backend acaba en 504 upstream_timeout, no cuelga", async () => {
    const f = fetchColgado();
    const pendiente = GET(peticion("GET", "advertising/dashboard"), ctx(["advertising", "dashboard"]));
    await jest.advanceTimersByTimeAsync(20_001);
    const r = await pendiente;
    expect(r.status).toBe(504);
    expect(await r.json()).toMatchObject({ error: "upstream_timeout" });
    expect(f.mock.calls[0]?.[1]?.signal).toBeDefined();
  });

  it("un GET que contesta a tiempo no se corta", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: 1 }), { status: 200, headers: { "Content-Type": "application/json" } }),
    ) as unknown as typeof fetch;
    const r = await GET(peticion("GET", "advertising/dashboard"), ctx(["advertising", "dashboard"]));
    expect(r.status).toBe(200);
  });

  it("una escritura NO lleva tope ni senal", async () => {
    const f = fetchColgado();
    POST(peticion("POST", "autos/dealers/d1/vehicles"), ctx(["autos", "dealers", "d1", "vehicles"]));
    await jest.advanceTimersByTimeAsync(60_000);
    expect(f).toHaveBeenCalledTimes(1);
    expect(f.mock.calls[0]?.[1]?.signal).toBeUndefined();
  });
});

describe("fetchWithFallback: tope en el cliente", () => {
  it("una peticion colgada devuelve el fallback con error Timeout", async () => {
    fetchColgado();
    const pendiente = fetchWithFallback<{ v: number }>("/api/v1/advertising/dashboard", { fallbackData: { v: 0 } });
    await jest.advanceTimersByTimeAsync(FETCH_TIMEOUT_MS_DEFAULT + 1);
    expect(await pendiente).toEqual({ data: { v: 0 }, source: "fallback", error: "Timeout", status: null });
  });

  it("timeoutMs propio", async () => {
    fetchColgado();
    const pendiente = fetchWithFallback<number>("/x", { fallbackData: 7, timeoutMs: 1_000 });
    await jest.advanceTimersByTimeAsync(1_001);
    expect((await pendiente).error).toBe("Timeout");
  });

  it("una senal externa abortada sigue dando AbortError, no Timeout", async () => {
    fetchColgado();
    const ext = new AbortController();
    const pendiente = fetchWithFallback<number>("/x", { fallbackData: 7, signal: ext.signal });
    ext.abort();
    expect((await pendiente).error).toBe("AbortError");
  });

  it("una respuesta a tiempo no deja el temporizador vivo", async () => {
    global.fetch = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ a: 1 }), { status: 200 }),
    ) as unknown as typeof fetch;
    const r = await fetchWithFallback<{ a: number }>("/x", { fallbackData: { a: 0 } });
    expect(r).toMatchObject({ source: "live", data: { a: 1 } });
    expect(jest.getTimerCount()).toBe(0);
  });
});
