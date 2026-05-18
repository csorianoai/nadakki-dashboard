import * as Sentry from "@sentry/react";
import { onCLS, onFCP, onLCP, onTTFB, type Metric } from "web-vitals";
import { PERF_METRICS_REPORT_INTERVAL_MS } from "@/lib/observability/constants";

type VitalsRow = { name: string; value: number; id?: string; rating?: string };

const buffer: VitalsRow[] = [];
let flushIntervalId: number | null = null;
let started = false;

function pushMetric(metric: Metric): void {
  buffer.push({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    rating: metric.rating,
  });
}

function captureApproxTtiFromNavigation(): void {
  if (typeof window === "undefined" || !("performance" in window)) return;

  const report = (): void => {
    if (typeof performance.getEntriesByType !== "function") return;
    const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    if (!nav || typeof nav.domInteractive !== "number") return;
    buffer.push({
      name: "TTI",
      value: nav.domInteractive,
      id: "navigation-domInteractive",
    });
  };

  if (document.readyState === "complete") {
    report();
    return;
  }
  window.addEventListener("load", report, { once: true });
}

export function flushPerformanceMetrics(): void {
  if (buffer.length === 0) return;
  const batch = buffer.splice(0, buffer.length);

  Sentry.addBreadcrumb({
    category: "performance",
    message: "web_vitals_batch",
    level: "info",
    data: { metrics: batch },
  });

  for (const m of batch) {
    try {
      Sentry.metrics.distribution(`frontend.vitals.${m.name}`, m.value, {
        unit: "millisecond",
      });
    } catch {
      /* ignore */
    }
  }
}

/**
 * Subscribes to CWV + navigation timing, flushes on an interval.
 */
export function initPerformanceReporting(): void {
  if (typeof window === "undefined" || started) return;
  started = true;

  onFCP(pushMetric);
  onLCP(pushMetric);
  onCLS(pushMetric);
  onTTFB(pushMetric);
  captureApproxTtiFromNavigation();

  flushIntervalId = window.setInterval(flushPerformanceMetrics, PERF_METRICS_REPORT_INTERVAL_MS);
}

export function teardownPerformanceReporting(): void {
  if (flushIntervalId != null) {
    window.clearInterval(flushIntervalId);
    flushIntervalId = null;
  }
  started = false;
  buffer.length = 0;
}
