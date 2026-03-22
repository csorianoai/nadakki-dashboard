/**
 * Safe fetch helper for dashboard panels: never throws; non-200 uses fallback.
 */

export type FetchSource = "live" | "fallback";

export type FetchWithFallbackResult<T> = {
  data: T;
  source: FetchSource;
  error: string | null;
  status: number | null;
};

export type FetchWithFallbackOptions = {
  tenantId?: string;
  fallbackData: unknown;
  signal?: AbortSignal;
  init?: Omit<RequestInit, "headers"> & { headers?: Record<string, string> };
};

export async function fetchWithFallback<T>(
  endpoint: string,
  options: FetchWithFallbackOptions
): Promise<FetchWithFallbackResult<T>> {
  const { tenantId, fallbackData, signal, init } = options;
  const fb = fallbackData as T;

  if (!endpoint || !endpoint.startsWith("http")) {
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
      ...((init?.headers as Record<string, string> | undefined) ?? {}),
    };
    if (tenantId) headers["X-Tenant-ID"] = tenantId;

    const response = await fetch(endpoint, {
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
        error: "Aborted",
        status: null,
      };
    }
    return {
      data: fb,
      source: "fallback",
      error: (e as Error)?.message ?? "Network error",
      status: null,
    };
  }
}
