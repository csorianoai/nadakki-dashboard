"use client";

import { useQuery } from "@tanstack/react-query";
import type { AccessClientContext } from "@/lib/access/client";
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
import { fetchCommercialSponsorships } from "@/lib/access/sponsorship";

const opts = { retry: shouldRetryAccessQuery, staleTime: 60_000, refetchOnWindowFocus: false } as const;

/**
 * Cache key for entitlement batches. The requested capability set is part of
 * the identity: two components in the same tenant/dealer/OU must never share
 * cached decisions when they ask for different capabilities.
 *
 * Sorting and de-duplicating makes the key stable for logically equivalent
 * requests such as ["a", "b"] and ["b", "a", "a"].
 */
export function accessBatchQueryKey(
  capabilityKeys: readonly string[],
  context: AccessClientContext | null,
) {
  const stableCapabilityKeys = [...new Set(capabilityKeys)].sort();
  return [
    ...accessQueryKey(ACCESS_ENDPOINTS.batch, context),
    "capabilities",
    ...stableCapabilityKeys,
  ] as const;
}

export function useAccessEntitlementsBatch(capabilityKeys: string[]) {
  const context = getAccessClientContext();
  return useQuery({
    queryKey: accessBatchQueryKey(capabilityKeys, context),
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

export function useCommercialSponsorships() {
  const context = getAccessClientContext();
  return useQuery({
    queryKey: accessQueryKey(ACCESS_ENDPOINTS.sponsorship, context),
    queryFn: () => fetchCommercialSponsorships(context),
    enabled: context != null,
    ...opts,
  });
}
