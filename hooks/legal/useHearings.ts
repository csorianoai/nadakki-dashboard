"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createHearing,
  getHearingConfig,
  getHearingKpis,
  listHearings,
  patchHearingStatus,
} from "@/lib/legal/hearings/hearings-api";
import type {
  HearingConfigResponse,
  HearingCreatePayload,
  HearingKPIs,
  HearingListFilters,
  HearingListResponse,
  HearingOut,
  HearingStatusPatchBody,
} from "@/lib/legal/hearings/hearings-types";

const KEYS = {
  config: (tenantId: string) => ["legal_hearings_config", tenantId] as const,
  kpis: (tenantId: string) => ["legal_hearings_kpis", tenantId] as const,
  list: (tenantId: string, filters: HearingListFilters) =>
    ["legal_hearings", tenantId, filters] as const,
};

function enabledFor(tenantId: string | undefined): boolean {
  return Boolean(tenantId?.trim());
}

export function useHearingConfig(tenantId: string | undefined) {
  return useQuery<HearingConfigResponse>({
    queryKey: KEYS.config(tenantId ?? ""),
    enabled: enabledFor(tenantId),
    staleTime: 5 * 60_000,
    queryFn: () => getHearingConfig(tenantId!),
  });
}

export function useHearingKpis(tenantId: string | undefined) {
  return useQuery<HearingKPIs>({
    queryKey: KEYS.kpis(tenantId ?? ""),
    enabled: enabledFor(tenantId),
    queryFn: () => getHearingKpis(tenantId!),
  });
}

export function useHearingsList(
  tenantId: string | undefined,
  filters: HearingListFilters = {},
) {
  return useQuery<HearingListResponse>({
    queryKey: KEYS.list(tenantId ?? "", filters),
    enabled: enabledFor(tenantId),
    queryFn: () => listHearings(tenantId!, filters),
  });
}

/** Invalidate the list + KPIs after a write so the UI reflects the new state. */
function useInvalidateHearings(tenantId: string | undefined) {
  const qc = useQueryClient();
  return () => {
    if (!tenantId) return;
    void qc.invalidateQueries({ queryKey: ["legal_hearings", tenantId] });
    void qc.invalidateQueries({ queryKey: KEYS.kpis(tenantId) });
  };
}

export function useCreateHearing(tenantId: string | undefined) {
  const invalidate = useInvalidateHearings(tenantId);
  return useMutation<HearingOut, Error, HearingCreatePayload>({
    mutationFn: (payload) => createHearing(tenantId!, payload),
    onSuccess: invalidate,
  });
}

export function usePatchHearingStatus(tenantId: string | undefined) {
  const invalidate = useInvalidateHearings(tenantId);
  return useMutation<
    HearingOut,
    Error,
    { hearingId: string; body: HearingStatusPatchBody }
  >({
    mutationFn: ({ hearingId, body }) => patchHearingStatus(tenantId!, hearingId, body),
    onSuccess: invalidate,
  });
}
