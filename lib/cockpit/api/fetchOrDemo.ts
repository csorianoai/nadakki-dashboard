import { PlatformApiError, platformFetch } from "@/lib/platformApi";

export async function fetchOrDemo<T extends { data_source?: string }>(
  path: string,
  demo: () => T,
): Promise<{ data: T; isDemo: boolean; error: string | null }> {
  try {
    const data = await platformFetch<T>(path);
    const ds = data.data_source ?? "live";
    const isDemo = ds === "none" || ds === "demo";
    return { data, isDemo, error: null };
  } catch (err) {
    if (err instanceof PlatformApiError && (err.status === 404 || err.status === 501)) {
      return { data: demo(), isDemo: true, error: `Endpoint no disponible (${err.status})` };
    }
    throw err;
  }
}

/** HTTP 404/501 → data_source none (never DEMO). See H-2-N in HYPOTHESIS_LEDGER. */
export async function fetchOrNone<T extends { data_source?: string }>(
  path: string,
  none: () => T,
): Promise<{ data: T; isAbsent: boolean; error: string | null }> {
  try {
    const data = await platformFetch<T>(path);
    return { data, isAbsent: false, error: null };
  } catch (err) {
    if (err instanceof PlatformApiError && (err.status === 404 || err.status === 501)) {
      return {
        data: none(),
        isAbsent: true,
        error: `Endpoint no disponible (${err.status})`,
      };
    }
    throw err;
  }
}
