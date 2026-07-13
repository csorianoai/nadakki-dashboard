import { PlatformApiError, platformFetch } from "@/lib/platformApi";

export type FetchPanelResult<T> = {
  data: T;
  isDemo: boolean;
  error: string | null;
};

export function isDemoDataSource(dataSource?: string): boolean {
  return dataSource === "none" || dataSource === "demo";
}

export async function fetchOrDemo<T extends { data_source?: string }>(
  path: string,
  demo: () => T,
): Promise<FetchPanelResult<T>> {
  try {
    const data = await platformFetch<T>(path);
    return { data, isDemo: isDemoDataSource(data.data_source), error: null };
  } catch (err) {
    if (
      err instanceof PlatformApiError &&
      (err.status === 404 || err.status === 501 || err.status === 500)
    ) {
      const data = demo();
      return { data, isDemo: true, error: `Endpoint no disponible (${err.status})` };
    }
    throw err;
  }
}
