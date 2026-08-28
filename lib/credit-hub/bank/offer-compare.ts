import type { OfferCompareDetail } from "@/lib/credit-hub/api/bankExperienceClient";

export function normalizeOfferCompareRows(data: { offers_detail?: OfferCompareDetail[]; [key: string]: unknown }) {
  return (data.offers_detail ?? []).map((detail, index) => {
    const terms = detail.terms ?? {};
    const numberOrNull = (value: unknown) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    };
    return {
      lender_code: detail.lender_code ?? "",
      lender_display_name: detail.lender_display_name,
      amount: numberOrNull(terms.amount_approved ?? terms.approved_amount),
      rate_apr: numberOrNull(terms.interest_rate_apr ?? terms.interest_rate),
      term_months: numberOrNull(terms.term_months),
      monthly_payment: numberOrNull(terms.monthly_payment),
      rank: index + 1,
      is_best: false,
    };
  }).sort((a, b) => a.rank - b.rank);
}
