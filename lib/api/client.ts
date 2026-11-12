/**
 * Safe JSON fetch for dashboard panels: never throws; non-OK or network errors return fallback.
 *
 * Automatically includes the JWT Authorization header on same-origin
 * requests if the user is authenticated (tenant isolation enforcement).
 */

import { tokenStorage } from "@/lib/auth/token-storage";
import { MS_LECTURA_CLIENTE, topeClienteMs } from "@/lib/api/timeouts";

export type FetchSource = "live" | "fallback";

export type FetchWithFallbackResult<T> = {
  data: T;
  source: FetchSource;
  error: string | null;
  status: number | null;
};

export type FetchWithFallbackOptions<T> = {
  tenantId?: string | null;
  fallbackData: T;
  signal?: AbortSignal;
  /**
   * Tope de espera. Sin el, una peticion colgada dejaba el panel en «Cargando…» para siempre
   * (el hook no pasa `signal` y aqui no hay reintento). Al vencer devuelve el fallback con error "Timeout".
   */
  timeoutMs?: number;
  headers?: Record<string, string>;
  init?: Omit<RequestInit, "headers" | "signal"> & { headers?: Record<string, string> };
};

/** Same-origin paths (e.g. /marketing/...) are proxied by next.config rewrites and app/api routes. */
function resolveFetchUrl(url: string): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) return url;
  return null;
}

/** Mayor que el tope del BFF para GET (20 s), para que el cliente vea primero su 504 con cuerpo. Ver lib/api/timeouts.ts. */
export const FETCH_TIMEOUT_MS_DEFAULT = MS_LECTURA_CLIENTE;

export async function fetchWithFallback<T>(
  url: string,
  options: FetchWithFallbackOptions<T>
): Promise<FetchWithFallbackResult<T>> {
  const { tenantId, fallbackData, signal, headers: extraHeaders, init } = options;
  const timeoutMs = options.timeoutMs ?? topeClienteMs((init?.method as string | undefined) ?? "GET", url, init?.body);
  const fb = fallbackData;

  const resolved = resolveFetchUrl(url);
  if (!resolved) {
    return {
      data: fb,
      source: "fallback",
      error: "Invalid fetch URL",
      status: null,
    };
  }

  const ctl = new AbortController();
  let vencio = false;
  const reloj = setTimeout(() => {
    vencio = true;
    ctl.abort();
  }, timeoutMs);
  const onAbortExterno = () => ctl.abort();
  if (signal) {
    if (signal.aborted) ctl.abort();
    else signal.addEventListener("abort", onAbortExterno, { once: true });
  }

  try {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      ...((init?.headers as Record<string, string> | undefined) ?? {}),
      ...extraHeaders,
    };
    if (tenantId) {
      headers["X-Tenant-ID"] = tenantId;
    }
    // Attach JWT for tenant isolation (middleware.ts enforces)
    if (!headers["Authorization"] && typeof window !== "undefined") {
      const token = tokenStorage.getAccessToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    const response = await fetch(resolved, {
      method: "GET",
      ...init,
      signal: ctl.signal,
      headers,
    });

    const status = response.status;
    // Single GET per call; no automatic retries (avoids 429 storms from client loops).
    if (status !== 200) {
      return {
        data: fb,
        source: "fallback",
        error: `HTTP ${status}`,
        status,
      };
    }
    const data = (await response.json()) as T;
    return { data, source: "live", error: null, status };
  } catch (e) {
    const name = (e as Error)?.name;
    if (vencio) {
      return { data: fb, source: "fallback", error: "Timeout", status: null };
    }
    if (name === "AbortError") {
      return {
        data: fb,
        source: "fallback",
        error: "AbortError",
        status: null,
      };
    }
    return {
      data: fb,
      source: "fallback",
      error: (e as Error)?.message ?? String(e),
      status: null,
    };
  } finally {
    clearTimeout(reloj);
    signal?.removeEventListener("abort", onAbortExterno);
  }
}
