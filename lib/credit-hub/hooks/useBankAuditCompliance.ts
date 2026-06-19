"use client";

/**
 * Global Bank Audit + Compliance hooks (PR-FE-6).
 *
 * Purpose: power the tenant-wide `/credit-hub/bank/audit` and
 * `/credit-hub/bank/compliance` pages with REAL event-sourced data instead of
 * rows synthesized client-side from the queue.
 *
 * Owner: Frontend Builder · Task Packet: PR-FE-6 (audit/compliance real API).
 *
 * Backend reality: there is NO dedicated tenant-wide audit/compliance LIST
 * endpoint. The authoritative data is per-application:
 *   - GET /api/v2/credit/applications/{id}/audit-trail  (getAuditTrail)
 *   - GET /api/v2/credit/compliance/{id}                (getComplianceReport)
 * So the global view is built by AGGREGATING the real per-application calls
 * across the tenant's active queue. This is real (no mock), tenant-scoped via
 * chFetch (X-Tenant-ID + Authorization), and shares the React Query cache with
 * the per-application detail page.
 *
 * Known limitation [PARTIAL]: aggregation is bounded to the most recent
 * GLOBAL_AGGREGATION_APP_LIMIT applications from the queue to keep request fan-out
 * reasonable. Full tenant-wide coverage requires a dedicated backend list
 * endpoint (see report: Remaining backend gaps).
 */

import { useMemo } from "react";
import { useQueries, useQuery } from "@tanstack/react-query";
import { getAuditTrail, getComplianceReport, getQueue } from "../api/bankClient";
import type { BankAuditEventView, BankComplianceIssueView } from "../types/bank-views";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

/** Upper bound on per-application detail fetches for the global views. */
export const GLOBAL_AGGREGATION_APP_LIMIT = 50;

const AUDIT_STALE_MS = 15_000;
const COMPLIANCE_STALE_MS = 30_000;

export interface BankGlobalAuditTrailResult {
  events: BankAuditEventView[];
  isLoading: boolean;
  isError: boolean;
  /** True when the queue loaded but per-application coverage is bounded by the limit. */
  isPartialCoverage: boolean;
  refetch: () => void;
}

export interface BankGlobalComplianceResult {
  issues: BankComplianceIssueView[];
  reviewedCount: number;
  isLoading: boolean;
  isError: boolean;
  isPartialCoverage: boolean;
  refetch: () => void;
}

/** Map heterogeneous backend severity strings onto the view's es-DO severities. */
function normalizeSeverity(raw: string | null | undefined): BankComplianceIssueView["severity"] {
  const s = (raw ?? "").trim().toLowerCase();
  if (s === "alta" || s === "high" || s === "critical" || s === "critica") return "alta";
  if (s === "media" || s === "medium" || s === "moderate") return "media";
  if (s === "baja" || s === "low") return "baja";
  return s || "media";
}

/**
 * Tenant-wide audit timeline built from the real per-application audit trail
 * endpoint, aggregated across the active queue. No synthetic events.
 */
export function useBankGlobalAuditTrail(appLimit: number = GLOBAL_AGGREGATION_APP_LIMIT): BankGlobalAuditTrailResult {
  const { tenantId } = useTenant();

  const queueQuery = useQuery({
    queryKey: chKeys.bankQueue(tenantId ?? "", { limit: appLimit }),
    queryFn: () => getQueue({ tenantId: tenantId!, limit: appLimit }),
    enabled: !!tenantId,
    staleTime: AUDIT_STALE_MS,
  });

  const appIds = useMemo(
    () => (queueQuery.data?.applications ?? []).map((a) => a.application_id).filter(Boolean),
    [queueQuery.data?.applications]
  );

  const trailQueries = useQueries({
    queries: appIds.map((id) => ({
      queryKey: chKeys.bankAuditTrail(tenantId ?? "", id),
      queryFn: () => getAuditTrail({ tenantId: tenantId!, applicationId: id }),
      enabled: !!tenantId,
      staleTime: AUDIT_STALE_MS,
    })),
  });

  const events = useMemo<BankAuditEventView[]>(() => {
    const out: BankAuditEventView[] = [];
    for (const q of trailQueries) {
      const trail = q.data;
      if (!trail) continue;
      trail.events.forEach((ev, idx) => {
        const details: Record<string, unknown> = {};
        if (ev.decision) details.decision = ev.decision;
        out.push({
          id: `${trail.application_id}-${ev.event}-${ev.timestamp}-${idx}`,
          timestamp: ev.timestamp,
          actor: ev.by || "system",
          action: ev.event,
          applicationId: trail.application_id,
          details: Object.keys(details).length > 0 ? details : undefined,
        });
      });
    }
    return out;
    // trailQueries identity changes each render; depend on the resolved data instead.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trailQueries.map((q) => q.dataUpdatedAt).join(",")]);

  const trailsPending = appIds.length > 0 && trailQueries.some((q) => q.isPending);
  const isLoading = queueQuery.isPending || trailsPending;
  const isError =
    queueQuery.isError || (appIds.length > 0 && trailQueries.length > 0 && trailQueries.every((q) => q.isError));

  return {
    events,
    isLoading,
    isError,
    isPartialCoverage: (queueQuery.data?.total_count ?? queueQuery.data?.total ?? appIds.length) > appIds.length,
    refetch: () => {
      void queueQuery.refetch();
      trailQueries.forEach((q) => void q.refetch());
    },
  };
}

/**
 * Tenant-wide compliance incidents built from the real per-application
 * compliance report endpoint, aggregated across the active queue. Each row is a
 * real `issues[]` entry from the backend compliance engine — no hardcoded
 * rule/severity/description.
 */
export function useBankGlobalCompliance(appLimit: number = GLOBAL_AGGREGATION_APP_LIMIT): BankGlobalComplianceResult {
  const { tenantId } = useTenant();

  const queueQuery = useQuery({
    queryKey: chKeys.bankQueue(tenantId ?? "", { limit: appLimit }),
    queryFn: () => getQueue({ tenantId: tenantId!, limit: appLimit }),
    enabled: !!tenantId,
    staleTime: COMPLIANCE_STALE_MS,
  });

  const appIds = useMemo(
    () => (queueQuery.data?.applications ?? []).map((a) => a.application_id).filter(Boolean),
    [queueQuery.data?.applications]
  );

  const reportQueries = useQueries({
    queries: appIds.map((id) => ({
      queryKey: chKeys.bankCompliance(tenantId ?? "", id),
      queryFn: () => getComplianceReport({ tenantId: tenantId!, applicationId: id }),
      enabled: !!tenantId,
      staleTime: COMPLIANCE_STALE_MS,
    })),
  });

  const issues = useMemo<BankComplianceIssueView[]>(() => {
    const out: BankComplianceIssueView[] = [];
    for (const q of reportQueries) {
      const report = q.data;
      if (!report) continue;
      report.issues.forEach((iss, idx) => {
        out.push({
          id: `${report.application_id}-${iss.type}-${idx}`,
          rule: iss.type,
          severity: normalizeSeverity(iss.severity),
          description: iss.action_required,
          application_id: report.application_id,
        });
      });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportQueries.map((q) => q.dataUpdatedAt).join(",")]);

  const reviewedCount = useMemo(
    () => reportQueries.filter((q) => q.data != null).length,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reportQueries.map((q) => q.dataUpdatedAt).join(",")]
  );

  const reportsPending = appIds.length > 0 && reportQueries.some((q) => q.isPending);
  const isLoading = queueQuery.isPending || reportsPending;
  const isError =
    queueQuery.isError || (appIds.length > 0 && reportQueries.length > 0 && reportQueries.every((q) => q.isError));

  return {
    issues,
    reviewedCount,
    isLoading,
    isError,
    isPartialCoverage: (queueQuery.data?.total_count ?? queueQuery.data?.total ?? appIds.length) > appIds.length,
    refetch: () => {
      void queueQuery.refetch();
      reportQueries.forEach((q) => void q.refetch());
    },
  };
}
