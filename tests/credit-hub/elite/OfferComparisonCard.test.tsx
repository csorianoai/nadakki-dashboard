/** @jest-environment jsdom */

import { render, screen } from "@testing-library/react";
import { OfferComparisonCard, computeOfferSavingsNote, offerTruthLevel } from "@/components/credit-hub/elite/OfferComparisonCard";
import type { CreditOffer } from "@/lib/credit-hub/types/offers";

function offer(overrides: Partial<CreditOffer> = {}): CreditOffer {
  return {
    id: "offer-1",
    application_id: "app-1",
    tenant_id: "tenant-1",
    lender_code: "pilot",
    lender_display_name: "Pilot",
    amount_approved: 500000,
    interest_rate_apr: 12,
    term_months: 48,
    monthly_payment: 13200,
    total_cost: null,
    currency: "DOP",
    stipulations: [],
    simulated: null,
    source_system: null,
    adapter_operation_mode: null,
    status: "approved",
    created_at: "2026-08-28T00:00:00Z",
    raw: {},
    ...overrides,
  };
}

describe("OfferComparisonCard provenance", () => {
  test("derives the collection badge from persisted offer provenance", () => {
    expect(offerTruthLevel([offer({ simulated: true })], false, false)).toBe("DEMO");
    expect(offerTruthLevel([offer({ simulated: false })], false, false)).toBe("REAL");
    expect(offerTruthLevel([offer({ simulated: false })], true, false)).toBe("DEMO");
  });

  test("shows a visible simulation notice", () => {
    render(<OfferComparisonCard offer={offer({ simulated: true })} currencyPrefix="RD$" />);
    expect(screen.getByTestId("offer-simulated-badge-offer-1")).toHaveTextContent(/decisión simulada/i);
  });

  test("does not show the simulation notice for a real offer", () => {
    render(<OfferComparisonCard offer={offer({ simulated: false })} currencyPrefix="RD$" />);
    expect(screen.queryByTestId("offer-simulated-badge-offer-1")).not.toBeInTheDocument();
  });

  test("does not describe simulated savings as real", () => {
    const note = computeOfferSavingsNote(
      [offer({ simulated: true }), offer({ id: "offer-2", interest_rate_apr: 15, simulated: true })],
      "offer-1",
      "RD$",
    );
    expect(note).toMatch(/comparación simulada/i);
    expect(note).not.toMatch(/ahorras/i);
  });

  test("does not invent a full-term savings amount when the term is absent", () => {
    const note = computeOfferSavingsNote(
      [offer({ term_months: null }), offer({ id: "offer-2", interest_rate_apr: 15, term_months: 48, monthly_payment: 15000 })],
      "offer-1",
      "RD$",
    );

    expect(note).toMatch(/mejor tasa/i);
    expect(note).not.toMatch(/ahorras/i);
    expect(note).not.toMatch(/60/);
  });
});
