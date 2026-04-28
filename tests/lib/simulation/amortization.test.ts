import { calculateAmortization } from "@/lib/credit/simulation/amortization";

describe("calculateAmortization", () => {
  it("returns empty array for invalid inputs", () => {
    expect(calculateAmortization(0, 12, 60)).toEqual([]);
    expect(calculateAmortization(100_000, 12, 0)).toEqual([]);
  });

  it("balance reaches near zero at last payment", () => {
    const rows = calculateAmortization(100_000, 12, 60);
    expect(rows.length).toBe(60);
    expect(rows[59].balance).toBeLessThan(1);
  });

  it("sum of principal payments equals original principal", () => {
    const rows = calculateAmortization(500_000, 14, 36);
    const totalPrincipal = rows.reduce((sum, r) => sum + r.principalPaid, 0);
    expect(totalPrincipal).toBeCloseTo(500_000, -1);
  });

  it("interest decreases over time", () => {
    const rows = calculateAmortization(200_000, 16, 24);
    expect(rows[0].interestPaid).toBeGreaterThan(rows[23].interestPaid);
  });

  it("handles zero rate (interest-free loan)", () => {
    const rows = calculateAmortization(120_000, 0, 12);
    expect(rows[0].payment).toBe(10_000);
    expect(rows[0].interestPaid).toBe(0);
  });
});
