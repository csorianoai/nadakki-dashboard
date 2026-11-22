"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchUpcomingDeadlines,
  postAcknowledgeDeadline,
} from "@/lib/legal/cases/legal-cases-api";

export interface UpcomingDeadline {
  deadline_id: string;
  case_id: string;
  case_title: string;
  case_number_internal: string;
  deadline_db_id: string;
  deadline_category: string;
  deadline_sub_category: string;
  trigger_event: string;
  effective_deadline_date: string;
  auto_calculated_deadline_date: string;
  legal_basis: string;
  is_peremptory: boolean;
  status: string;
  acknowledged_at: string | null;
  acknowledged_by: string | null;
  /** Campos del backend corregido; ausentes en uno anterior. */
  overdue?: boolean;
  computation_rule?: string | null;
  has_human_override?: boolean;
  override_reason?: string | null;
  /** true/false según el catálogo legal; null/ausente = no verificado. */
  catalog_validated?: boolean | null;
}

export interface UpcomingDeadlinesResponse {
  deadlines: UpcomingDeadline[];
  count: number;
  horizon_days: number;
  /** null = backend anterior: no se sabe si los vencidos vienen incluidos. */
  include_overdue?: boolean | null;
  as_of_date_rd?: string | null;
}

export function useUpcomingDeadlines(
  tenantId: string | undefined,
  horizonDays: number = 30,
  includeAcknowledged: boolean = false,
  includeOverdue: boolean = false,
) {
  const qc = useQueryClient();
  const q = useQuery<UpcomingDeadlinesResponse>({
    queryKey: ["legal_upcoming_deadlines", tenantId ?? "", horizonDays, includeAcknowledged, includeOverdue],
    enabled: Boolean(tenantId?.trim()),
    queryFn: async () => {
      const raw = await fetchUpcomingDeadlines(tenantId!, horizonDays, includeAcknowledged, includeOverdue);
      return raw as unknown as UpcomingDeadlinesResponse;
    },
    refetchInterval: 5 * 60 * 1000, // refresh every 5 min
  });

  const acknowledge = useMutation({
    mutationFn: async (args: { deadlineId: string; acknowledgedBy: string }) =>
      postAcknowledgeDeadline(tenantId!, args.deadlineId, args.acknowledgedBy),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["legal_upcoming_deadlines"] });
    },
  });

  return {
    ...q,
    acknowledgeDeadline: acknowledge.mutateAsync,
    acknowledging: acknowledge.isPending,
  };
}
