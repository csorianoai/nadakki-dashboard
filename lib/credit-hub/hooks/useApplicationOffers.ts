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
import { enrichNadakkiDemoOffer } from "../demo/enrich-nadakki-demo-offers";
import { isNadakkiDemoTenant } from "../utils/nadakki-demo-tenant";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";
import type { CreditOffer, OffersListResponse } from "../types/offers";

/** Live-poll interval while offers are still arriving (pre-acceptance). */
export const OFFERS_POLL_MS = 5_000;

/**
 * Polling decision (extracted for testability): keep polling every
 * OFFERS_POLL_MS while no offer has been accepted; stop once one has, since the
 * application is then settled (OFFER_SELECTED) and no further offers will arrive.
 */
export function offersRefetchInterval(
  offers: ReadonlyArray<{ status: string }> | undefined,
): number | false {
  const settled = (offers ?? []).some((o) => o.status === "accepted");
  return settled ? false : OFFERS_POLL_MS;
}

export function useApplicationOffers(applicationId: string | null | undefined) {
  const { tenantId } = useTenant();

  const offersQuery = useQuery<OffersListResponse>({
    queryKey: chKeys.creditCoreOffers(tenantId ?? "", applicationId ?? ""),
    queryFn: async () => {
      const response = await listOffers({ tenantId: tenantId!, applicationId: applicationId! });
      if (!isNadakkiDemoTenant(tenantId)) return response;
      return {
        ...response,
        offers: response.offers.map((offer, index) => enrichNadakkiDemoOffer(offer, index)),
      };
    },
    enabled: !!tenantId && !!applicationId,
    retry: 1,
    staleTime: 15_000,
    // Live-poll while the dealer watches so newly arriving bank offers/counteroffers
    // surface without a manual refresh. Ported (adapted) from the retired legacy
    // useOffers 5s polling, but conditional: once an offer is accepted the
    // application is settled (OFFER_SELECTED), so polling stops.
    refetchInterval: (query) => offersRefetchInterval(query.state.data?.offers),
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
