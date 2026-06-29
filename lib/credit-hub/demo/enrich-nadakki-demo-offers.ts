import type { CreditOffer } from "../types/offers";

/** Plausible demo terms per lender index — nadakki-demo only, when backend rows lack numerics. */
const DEMO_TERMS: Array<Pick<CreditOffer, "amount_approved" | "interest_rate_apr" | "term_months" | "monthly_payment">> = [
  { amount_approved: 850_000, interest_rate_apr: 0.117, term_months: 60, monthly_payment: 18_750 },
  { amount_approved: 820_000, interest_rate_apr: 0.109, term_months: 72, monthly_payment: 15_200 },
  { amount_approved: 880_000, interest_rate_apr: 0.121, term_months: 48, monthly_payment: 22_400 },
  { amount_approved: 800_000, interest_rate_apr: 0.113, term_months: 60, monthly_payment: 17_900 },
];

/**
 * Fill missing offer numerics for nadakki-demo exercise flows only.
 * Does not overwrite values returned by the backend.
 */
export function enrichNadakkiDemoOffer(offer: CreditOffer, index: number): CreditOffer {
  const seed = DEMO_TERMS[index % DEMO_TERMS.length]!;
  return {
    ...offer,
    amount_approved: offer.amount_approved ?? seed.amount_approved,
    interest_rate_apr: offer.interest_rate_apr ?? seed.interest_rate_apr,
    term_months: offer.term_months ?? seed.term_months,
    monthly_payment: offer.monthly_payment ?? seed.monthly_payment,
  };
}
