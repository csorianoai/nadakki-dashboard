import * as Sentry from "@sentry/react";
import { SENTRY_SAMPLE_RATE_DEV, SENTRY_SAMPLE_RATE_PROD } from "@/lib/observability/constants";

let clientInitialized = false;

export function resetClientTelemetryForTests(): void {
  clientInitialized = false;
}

const SENSITIVE_KEY_RE =
  /(password|passwd|secret|token|authorization|bearer|ssn|social_security|email|phone|credit_card|card_number|cvv|pin)\b/i;

function scrubString(s: string): string {
  let out = s;
  out = out.replace(/\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, "[redacted-email]");
  out = out.replace(/\b\+?\d[\d\s().-]{8,}\b/g, "[redacted-phone]");
  out = out.replace(/\b(?:\d[ -]*?){13,16}\b/g, "[redacted-pan]");
  return out;
}

function scrubValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY_RE.test(key)) return "[redacted]";
  if (typeof value === "string") return scrubString(value);
  return value;
}

export function scrubUnknown(value: unknown, depth = 0): unknown {
  if (depth > 6) return "[truncated-depth]";
  if (value == null) return value;
  if (typeof value === "string") return scrubString(value);
  if (typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((v) => scrubUnknown(v, depth + 1));
  const obj = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(obj)) {
    next[k] = scrubValue(k, scrubUnknown(v, depth + 1));
  }
  return next;
}

/** PII scrubbing before events leave the browser (defense in depth). */
export function scrubSentryEvent<T extends Sentry.Event>(event: T): T {
  if (event.message) event.message = scrubString(event.message);
  if (event.logger) event.logger = scrubString(String(event.logger));
  if (event.user) {
    event.user = scrubUnknown(event.user) as Sentry.User;
  }
  if (event.request) {
    event.request = scrubUnknown(event.request) as NonNullable<Sentry.Event["request"]>;
  }
  if (event.extra) {
    event.extra = scrubUnknown(event.extra) as Sentry.Event["extra"];
  }
  if (event.contexts) {
    event.contexts = scrubUnknown(event.contexts) as Sentry.Event["contexts"];
  }
  if (event.breadcrumbs) {
    event.breadcrumbs = event.breadcrumbs.map((b) => ({
      ...b,
      message: b.message ? scrubString(b.message) : b.message,
      data: b.data ? (scrubUnknown(b.data) as Record<string, unknown>) : b.data,
    }));
  }
  return event;
}

function getTracesSampleRate(): number {
  return process.env.NODE_ENV === "production" ? SENTRY_SAMPLE_RATE_PROD : SENTRY_SAMPLE_RATE_DEV;
}

/**
 * Initializes browser Sentry (client components only).
 * DSN from NEXT_PUBLIC_SENTRY_DSN; no-op when unset.
 */
export function initClientTelemetry(): void {
  if (typeof window === "undefined" || clientInitialized) return;

  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN?.trim();
  if (!dsn) return;

  const isProd = process.env.NODE_ENV === "production";

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    tracesSampleRate: getTracesSampleRate(),
    replaysSessionSampleRate: isProd ? 0.05 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    integrations: [Sentry.browserTracingIntegration(), Sentry.replayIntegration()],
    beforeSend(event) {
      return scrubSentryEvent(event);
    },
  });

  clientInitialized = true;
}

export function setSentryTenantId(tenantId: string | null | undefined): void {
  if (typeof window === "undefined") return;
  if (!Sentry.getClient()) return;
  const tag = tenantId?.trim() ? tenantId.trim() : "unknown";
  Sentry.setTag("tenant_id", tag);
}

export function captureClientException(error: Error, context?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  if (!Sentry.getClient()) return;
  Sentry.captureException(error, context ? { extra: scrubUnknown(context) as Record<string, unknown> } : undefined);
}

export function captureApiError(
  err: unknown,
  ctx: { endpoint?: string; status?: number; method?: string; tenantId?: string | null },
): void {
  if (typeof window === "undefined") return;
  if (!Sentry.getClient()) return;

  const error = err instanceof Error ? err : new Error(typeof err === "string" ? err : "API error");
  Sentry.captureException(error, {
    tags: {
      kind: "api_error",
      ...(ctx.status != null ? { http_status: String(ctx.status) } : {}),
    },
    extra: scrubUnknown({
      endpoint: ctx.endpoint,
      method: ctx.method,
      tenant_id: ctx.tenantId ?? undefined,
    }) as Record<string, unknown>,
  });
}
