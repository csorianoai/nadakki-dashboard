import * as Sentry from "@sentry/react";
import { scrubUnknown } from "@/lib/observability/telemetry";

export type CriticalUserAction = "claim" | "decide" | "upload";

/**
 * Manual tracking for high-value flows (claim / decide / upload).
 */
export function trackCriticalUserAction(
  action: CriticalUserAction,
  details?: Record<string, unknown>,
  tenantId?: string | null,
): void {
  if (typeof window === "undefined") return;
  if (!Sentry.getClient()) return;

  Sentry.addBreadcrumb({
    category: "user.critical_action",
    message: action,
    level: "info",
    data: scrubUnknown({
      ...details,
      tenant_id: tenantId ?? undefined,
    }) as Record<string, unknown>,
  });
}

/**
 * Route change / SPA page context for Sentry.
 */
export function trackPageView(pathname: string, tenantId: string | null | undefined): void {
  if (typeof window === "undefined") return;
  if (!Sentry.getClient()) return;

  const safePath = pathname.split("?")[0] ?? pathname;
  Sentry.setTag("route", safePath);
  Sentry.addBreadcrumb({
    category: "navigation",
    message: "page_view",
    level: "info",
    data: scrubUnknown({
      pathname: safePath,
      tenant_id: tenantId ?? undefined,
    }) as Record<string, unknown>,
  });
}

const TRACK_ATTR = "data-nadakki-track";

/**
 * Delegated click tracking for elements with `data-nadakki-track="action.name"`.
 * Returns a detach function.
 */
export function initUserActionClickTracking(): () => void {
  if (typeof document === "undefined") return () => {};

  const onClick = (e: MouseEvent): void => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    const el = t.closest(`[${TRACK_ATTR}]`);
    if (!el) return;
    const name = el.getAttribute(TRACK_ATTR)?.trim();
    if (!name || !Sentry.getClient()) return;

    Sentry.addBreadcrumb({
      category: "ui.click",
      message: name,
      level: "info",
    });
  };

  document.addEventListener("click", onClick, true);
  return () => document.removeEventListener("click", onClick, true);
}
