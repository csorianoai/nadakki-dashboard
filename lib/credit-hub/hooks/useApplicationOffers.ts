"use client";

/**
 * Hook for the dealer multi-lender offers list.
 *
 * Mirrors useCreditApplicationDetail's pattern (separate useQuery with its own
 * loading/error state) so the offers section has loading/error/empty states
 * independent from the general dossier query. Owner: Credit Hub Dealer.
 */
import { useQuery } from "@tanstack/react-query";
import { listOffers } from "../api/offersClient";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";
import type { CreditOffer, OffersListResponse } from "../types/offers";

export function useApplicationOffers(applicationId: string | null | undefined) {
  const { tenantId } = useTenant();

  const offersQuery = useQuery<OffersListResponse>({
    queryKey: chKeys.creditCoreOffers(tenantId ?? "", applicationId ?? ""),
    queryFn: () => listOffers({ tenantId: tenantId!, applicationId: applicationId! }),
    enabled: !!tenantId && !!applicationId,
    retry: 1,
    staleTime: 15_000,
  });

  const offers: CreditOffer[] = offersQuery.data?.offers ?? [];

  return {
    offers,
    pagination: offersQuery.data?.pagination ?? null,
    isLoading: offersQuery.isLoading,
    isFetching: offersQuery.isFetching,
    isError: offersQuery.isError,
    error: offersQuery.error,
    refetch: async () => {
      await offersQuery.refetch();
    },
  };
}
