"use client";

import { useLegalAuditTrail } from "@/hooks/useLegalCore";
import type { AuditTrailEntry } from "@/types/legal";

export function useLegalRecentActivity(tenantId: string | undefined, limit = 5) {
  const { entries, loading, error, refetch } = useLegalAuditTrail(tenantId, undefined, limit);

  return {
    entries: entries as AuditTrailEntry[],
    loading,
    error,
    refetch,
  };
}
