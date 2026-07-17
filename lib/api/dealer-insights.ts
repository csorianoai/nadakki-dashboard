/** Dealer AI insights API — Fase 8 with 24h cache + mock fallback. */

import { autosFetch } from "@/lib/autos-consumer-api";
import { demoDelay } from "@/lib/autos-agent/demo-delay";
import { FEATURE_INSIGHTS_BACKEND } from "@/lib/autos-agent/feature-flags";
import { MOCK_INSIGHTS, type DealerInsightsPayload } from "@/lib/dealer/insights-mock";

const CACHE_MS = 24 * 60 * 60 * 1000;

function cacheKey(dealerId: string) {
  return `nadakki_insights_${dealerId}`;
}

function readCache(dealerId: string): DealerInsightsPayload | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(cacheKey(dealerId));
    if (!raw) return null;
    const { data, at } = JSON.parse(raw) as { data: DealerInsightsPayload; at: number };
    if (Date.now() - at > CACHE_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(dealerId: string, data: DealerInsightsPayload) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(cacheKey(dealerId), JSON.stringify({ data, at: Date.now() }));
}

export type InsightsApiResult = { data: DealerInsightsPayload; fromBackend: boolean; cached: boolean };

export async function getDealerInsights(dealerId: string): Promise<InsightsApiResult> {
  const cached = readCache(dealerId);
  if (cached) return { data: cached, fromBackend: false, cached: true };

  if (FEATURE_INSIGHTS_BACKEND) {
    try {
      const res = await autosFetch<DealerInsightsPayload>(
        `/api/v1/autos_ai/dealer_ai/insights?dealer_id=${encodeURIComponent(dealerId)}`,
      );
      if (res) {
        writeCache(dealerId, res);
        return { data: res, fromBackend: true, cached: false };
      }
    } catch (error) {
      console.warn("Insights API failed, using mock", error);
    }
  }

  await demoDelay();
  writeCache(dealerId, MOCK_INSIGHTS);
  return { data: MOCK_INSIGHTS, fromBackend: false, cached: false };
}

export async function regenerateInsights(dealerId: string): Promise<InsightsApiResult> {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(cacheKey(dealerId));
  }

  if (FEATURE_INSIGHTS_BACKEND) {
    try {
      const res = await autosFetch<DealerInsightsPayload>(
        `/api/v1/autos_ai/dealer_ai/insights?dealer_id=${encodeURIComponent(dealerId)}&regenerate=1`,
        { method: "POST" },
      );
      if (res) {
        writeCache(dealerId, res);
        return { data: res, fromBackend: true, cached: false };
      }
    } catch (error) {
      console.warn("Regenerate insights failed", error);
    }
  }

  await demoDelay(500, 1000);
  const data = { ...MOCK_INSIGHTS, updatedAt: new Date().toISOString() };
  writeCache(dealerId, data);
  return { data, fromBackend: false, cached: false };
}

export function downloadWeeklyReportPdf(date: string) {
  const content = `Nadakki AI — Reporte Semanal\nGenerado: ${date}\n\n[Demo PDF — conectar backend para reporte completo]`;
  const blob = new Blob([content], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nadakki-reporte-${date}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
