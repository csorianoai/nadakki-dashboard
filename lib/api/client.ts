/**
 * Safe JSON fetch for dashboard panels: never throws; non-OK or network errors return fallback.
 */

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
  headers?: Record<string, string>;
  init?: Omit<RequestInit, "headers" | "signal"> & { headers?: Record<string, string> };
};

/** Same-origin paths (e.g. /marketing/...) are proxied by next.config rewrites. */
function resolveFetchUrl(url: string): string | null {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  if (url.startsWith("/")) {
    if (typeof window !== "undefined") {
      return `${window.location.origin}${url}`;
    }
    const base = (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/$/, "");
    return base ? `${base}${url}` : null;
  }
  return null;
}

export async function fetchWithFallback<T>(
  url: string,
  options: FetchWithFallbackOptions<T>
): Promise<FetchWithFallbackResult<T>> {
  const { tenantId, fallbackData, signal, headers: extraHeaders, init } = options;
  const fb = fallbackData;

  const resolved = resolveFetchUrl(url);
  if (!resolved) {
    return {
      data: fb,
      source: "fallback",
      error: "Missing NEXT_PUBLIC_API_URL",
      status: null,
    };
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

    const response = await fetch(resolved, {
      method: "GET",
      ...init,
      signal,
      headers,
    });

    const status = response.status;
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
  }
}
