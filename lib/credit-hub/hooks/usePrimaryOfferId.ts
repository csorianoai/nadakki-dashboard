"use client";

import { useApplicationOffers } from "./useApplicationOffers";

const PREFERRED_STATUSES = ["counter_offer", "conditional", "accepted", "approved", "pending"];

/** Pick the best offer for amortization/conditions/export (counter-offer first). */
export function pickPrimaryOfferId(offers: ReadonlyArray<{ id: string; status: string }>): string | null {
  for (const status of PREFERRED_STATUSES) {
    const match = offers.find((o) => o.status === status);
    if (match) return match.id;
  }
  return offers[0]?.id ?? null;
}

export function usePrimaryOfferId(applicationId: string | null | undefined) {
  const { offers, isLoading } = useApplicationOffers(applicationId);
  return { offerId: pickPrimaryOfferId(offers), isLoading, offers };
}
