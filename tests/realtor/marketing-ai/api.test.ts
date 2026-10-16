jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn(), getAuthHeaders: () => ({}) }));

import { hasData, parseMarketingSummary } from "@/lib/realtor/marketing-ai/api";

const body = {
  period: { from: "2026-10-01", to: "2026-10-16" },
  metrics: [
    { key: "campaigns_running", quality: "OK", value: 3 },
    { key: "leads_attributed", quality: "NO_DISPONIBLE", value: null, reason: "x" },
    { key: "bad", quality: "OK", value: 1.5 },
  ],
  spend: [
    { kind: "sale", currency: "USD", campaigns: 2, spend: "800.00", budget: "1000.00", leads_attributed: 4, cost_per_lead: "200.00" },
    { kind: "rental", currency: "ARS", campaigns: 1, spend: "10.00", budget: null, leads_attributed: null, cost_per_lead: null },
    { kind: "x" },
  ],
};

describe("parseMarketingSummary (C-RE-OLA3 marketing-ai)", () => {
  it("traduce MarketingAiSummary y descarta lo inválido; null nunca pasa a 0", () => {
    expect(parseMarketingSummary(body)).toEqual({
      period: { from: "2026-10-01", to: "2026-10-16" },
      metrics: [{ key: "campaigns_running", value: 3 }, { key: "leads_attributed", value: null }],
      spend: [
        { kind: "sale", currency: "USD", campaigns: 2, spend: "800.00", budget: "1000.00", leads: 4, costPerLead: "200.00" },
        { kind: "rental", currency: "ARS", campaigns: 1, spend: "10.00", budget: null, leads: null, costPerLead: null },
      ],
    });
  });
  it("forma inesperada → null", () => {
    expect(parseMarketingSummary(null)).toBeNull();
    expect(parseMarketingSummary({ ...body, period: null })).toBeNull();
    expect(parseMarketingSummary({ ...body, spend: {} })).toBeNull();
  });
  it("sin datos reales → hasData false", () => {
    const s = parseMarketingSummary({ ...body, metrics: [{ key: "campaigns_running", quality: "NO_DISPONIBLE", value: null, reason: "x" }], spend: [] })!;
    expect(hasData(s)).toBe(false);
    expect(hasData(parseMarketingSummary(body)!)).toBe(true);
  });
});
