"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ACCESS_ENDPOINTS,
  accessQueryKey,
  fetchAccessPlans,
  fetchAccessReadiness,
  fetchAccessSubscription,
  fetchEntitlementsBatch,
  getAccessClientContext,
  shouldRetryAccessQuery,
} from "@/lib/access/client";

const opts = { retry: shouldRetryAccessQuery, staleTime: 60_000, refetchOnWindowFocus: false } as const;

export function useAccessEntitlementsBatch(capabilityKeys: string[]) {
  const context = getAccessClientContext();
  return useQuery({
    queryKey: accessQueryKey(ACCESS_ENDPOINTS.batch, context),
    queryFn: () => fetchEntitlementsBatch(capabilityKeys, context),
    enabled: context != null,
    ...opts,
  });
}

export function useAccessReadiness() {
  const context = getAccessClientContext();
  return useQuery({
    queryKey: accessQueryKey(ACCESS_ENDPOINTS.readiness, context),
    queryFn: () => fetchAccessReadiness(context),
    enabled: context != null,
    ...opts,
  });
}

export function useAccessPlans() {
  const context = getAccessClientContext();
  return useQuery({
    queryKey: accessQueryKey(ACCESS_ENDPOINTS.plans, context),
    queryFn: () => fetchAccessPlans(context),
    enabled: context != null,
    ...opts,
  });
}

export function useAccessSubscription() {
  const context = getAccessClientContext();
  return useQuery({
    queryKey: accessQueryKey(ACCESS_ENDPOINTS.subscription, context),
    queryFn: () => fetchAccessSubscription(context),
    enabled: context != null,
    ...opts,
  });
}
