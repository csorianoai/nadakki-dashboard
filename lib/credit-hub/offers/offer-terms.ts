import type { CreditOffer } from "../types/offers";

/** Minimum financial fields required before the dealer can accept an offer. */
export function offerHasCompleteTerms(offer: CreditOffer): boolean {
  return (
    offer.interest_rate_apr != null &&
    offer.interest_rate_apr > 0 &&
    offer.amount_approved != null &&
    offer.amount_approved > 0 &&
    offer.term_months != null &&
    offer.term_months > 0 &&
    offer.monthly_payment != null &&
    offer.monthly_payment > 0
  );
}
