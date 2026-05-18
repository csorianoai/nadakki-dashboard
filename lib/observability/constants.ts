/** Production tracing sample rate (10%). */
export const SENTRY_SAMPLE_RATE_PROD = 0.1;

/** Development tracing sample rate (100%). */
export const SENTRY_SAMPLE_RATE_DEV = 1.0;

/** Interval for batching Web Vitals / navigation timing into Sentry breadcrumbs and metrics. */
export const PERF_METRICS_REPORT_INTERVAL_MS = 30_000;

/** When false or "0", client telemetry (Sentry, vitals batching, click delegation) stays off. */
export function isTelemetryEnabled(): boolean {
  if (typeof process === "undefined") return true;
  const v = process.env.NEXT_PUBLIC_ENABLE_TELEMETRY;
  if (v === "false" || v === "0") return false;
  return true;
}

/**
 * Effective Sentry tracesSampleRate: optional override from NEXT_PUBLIC_SENTRY_SAMPLE_RATE (0–1),
 * otherwise production vs development defaults.
 */
export function getSentryTracesSampleRate(): number {
  if (typeof process !== "undefined") {
    const raw = process.env.NEXT_PUBLIC_SENTRY_SAMPLE_RATE?.trim();
    if (raw) {
      const n = Number.parseFloat(raw);
      if (Number.isFinite(n) && n >= 0 && n <= 1) return n;
    }
  }
  const isProd = typeof process !== "undefined" && process.env?.NODE_ENV === "production";
  return isProd ? SENTRY_SAMPLE_RATE_PROD : SENTRY_SAMPLE_RATE_DEV;
}
