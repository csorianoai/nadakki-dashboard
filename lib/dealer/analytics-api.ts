import { apiFetch } from "@/lib/api/fetch-client";
import type { AnalyticsPeriod, DealerAnalytics } from "@/types/dealer-analytics";

export function isDealerAnalyticsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_FEATURE_DEALER_ANALYTICS === "true";
}

export async function getDealerAnalytics(period: AnalyticsPeriod = "30d"): Promise<DealerAnalytics> {
  const response = await apiFetch(`/api/v2/analytics/dealer/summary?period=${encodeURIComponent(period)}`, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(`Analytics fetch failed: ${response.status}`);
  }
  return response.json() as Promise<DealerAnalytics>;
}

export async function exportAnalyticsCSV(period: AnalyticsPeriod): Promise<Blob> {
  const response = await apiFetch(`/api/v2/analytics/dealer/export?period=${encodeURIComponent(period)}&format=csv`, {
    method: "GET",
  });
  if (!response.ok) {
    throw new Error(`CSV export failed: ${response.status}`);
  }
  return response.blob();
}

export function downloadExportedBlob(blob: Blob, filename: string): void {
  if (typeof document === "undefined") return;
  const canBlob =
    typeof URL !== "undefined" &&
    typeof URL.createObjectURL === "function" &&
    typeof URL.revokeObjectURL === "function";
  const url = canBlob ? URL.createObjectURL(blob) : "";
  if (!url) return;
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  if (canBlob) URL.revokeObjectURL(url);
}