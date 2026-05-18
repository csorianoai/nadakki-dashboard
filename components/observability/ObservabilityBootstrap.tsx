"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useTenant } from "@/contexts/TenantContext";
import { initClientTelemetry, setSentryTenantId } from "@/lib/observability/telemetry";
import {
  flushPerformanceMetrics,
  initPerformanceReporting,
  teardownPerformanceReporting,
} from "@/lib/observability/performance";
import { initUserActionClickTracking, trackPageView } from "@/lib/observability/user-actions";
import { isTelemetryEnabled } from "@/lib/observability/constants";

/**
 * Client-only observability: Sentry, Web Vitals batching, page views, delegated click tracking.
 * Must render under {@link TenantProvider} so tenant tags stay aligned.
 */
export function ObservabilityBootstrap() {
  const pathname = usePathname();
  const { tenantId } = useTenant();

  useEffect(() => {
    if (!isTelemetryEnabled()) return;
    initClientTelemetry();
    initPerformanceReporting();
    const detachClicks = initUserActionClickTracking();
    return () => {
      flushPerformanceMetrics();
      detachClicks();
      teardownPerformanceReporting();
    };
  }, []);

  useEffect(() => {
    if (!isTelemetryEnabled()) return;
    setSentryTenantId(tenantId);
  }, [tenantId]);

  useEffect(() => {
    if (!isTelemetryEnabled()) return;
    if (!pathname) return;
    trackPageView(pathname, tenantId);
  }, [pathname, tenantId]);

  return null;
}
