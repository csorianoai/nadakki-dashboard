jest.mock("@/lib/api/fetch-client", () => ({ apiFetch: jest.fn(), getAuthHeaders: () => ({}) }));

import { hasData, parseCareer } from "@/lib/realtor/career-director/api";

const body = {
  period: { from: "2026-10-01", to: "2026-10-16" },
  metrics: [
    { key: "closings_count", quality: "OK", value: 3 },
    { key: "active_listings", quality: "NO_DISPONIBLE", value: null, reason: "x" },
    { key: "bad", quality: "OK", value: 1.5 },
  ],
  closed_volume: [{ kind: "sale", currency: "USD", count: 2, total: "410000.00", basis: "sale_price" }, { kind: "x" }],
  achievements: [{ key: "first_closing", earned_at: "2026-09-20T15:00:00Z", subject: null }, { key: "nope", earned_at: "z" }],
};

describe("parseCareer (C-RE-OLA3 career)", () => {
  it("traduce CareerSummary y descarta lo inválido", () => {
    expect(parseCareer(body)).toEqual({
      period: { from: "2026-10-01", to: "2026-10-16" },
      metrics: [{ key: "closings_count", value: 3 }, { key: "active_listings", value: null }],
      volume: [{ kind: "sale", currency: "USD", count: 2, total: "410000.00" }],
      achievements: [{ key: "first_closing", earnedAt: "2026-09-20T15:00:00Z" }],
    });
  });
  it("forma inesperada → null", () => {
    expect(parseCareer(null)).toBeNull();
    expect(parseCareer({ ...body, period: null })).toBeNull();
    expect(parseCareer({ ...body, metrics: {} })).toBeNull();
  });
  it("sin datos reales (todo NO_DISPONIBLE o vacío) → hasData false", () => {
    const c = parseCareer({ ...body, metrics: [{ key: "closings_count", quality: "NO_DISPONIBLE", value: null, reason: "x" }], closed_volume: [], achievements: [] })!;
    expect(hasData(c)).toBe(false);
    expect(hasData(parseCareer(body)!)).toBe(true);
  });
});
