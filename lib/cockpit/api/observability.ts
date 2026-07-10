import { PlatformApiError, platformFetch } from "@/lib/platformApi";
import {
  demoActivity,
  demoAlerts,
  demoCoresSummary,
  demoNetworkHealth,
} from "../demo";
import type {
  ActivityResponse,
  AlertsResponse,
  CoresSummaryResponse,
  NetworkHealthResponse,
  WithDataSource,
} from "../types";

export type PanelResult<T> = {
  data: T;
  isDemo: boolean;
  error: string | null;
  status: "loading" | "success" | "error";
};

async function fetchOrDemo<T extends WithDataSource>(
  path: string,
  demo: () => T,
): Promise<{ data: T; isDemo: boolean; error: string | null }> {
  try {
    const data = await platformFetch<T>(path);
    const isDemo = data.data_source === "none";
    return { data, isDemo, error: null };
  } catch (err) {
    if (err instanceof PlatformApiError && (err.status === 404 || err.status === 501)) {
      const data = demo();
      return { data, isDemo: true, error: `Endpoint no disponible (${err.status})` };
    }
    throw err;
  }
}

export function fetchNetworkHealth() {
  return fetchOrDemo<NetworkHealthResponse>("/api/v1/cockpit/network/health", demoNetworkHealth);
}

export function fetchCoresSummary() {
  return fetchOrDemo<CoresSummaryResponse>("/api/v1/cockpit/network/cores", demoCoresSummary);
}

export function fetchActivity(limit = 10) {
  return fetchOrDemo<ActivityResponse>(`/api/v1/cockpit/network/overview?activity_limit=${limit}`, demoActivity);
}

export function fetchOpenAlerts() {
  return fetchOrDemo<AlertsResponse>("/api/v1/cockpit/network/overview?alerts_only=true", demoAlerts);
}
