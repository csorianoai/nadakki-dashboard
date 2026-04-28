import { normalizeToMonthly, calculateTotalMonthlyIncome } from "@/lib/credit/utils/income-normalizer";

describe("income-normalizer", () => {
  it("normalizes MENSUAL as identity", () => {
    expect(normalizeToMonthly(1000, "MENSUAL")).toBe(1000);
  });
  it("normalizes QUINCENAL as x2", () => {
    expect(normalizeToMonthly(500, "QUINCENAL")).toBe(1000);
  });
  it("normalizes SEMANAL with 4.33 multiplier", () => {
    expect(normalizeToMonthly(250, "SEMANAL")).toBeCloseTo(1082.5, 2);
  });
  it("normalizes ANUAL dividing by 12", () => {
    expect(normalizeToMonthly(12000, "ANUAL")).toBe(1000);
  });
  it("uses variable avg for VARIABLE frequency", () => {
    expect(normalizeToMonthly(0, "VARIABLE", 1500)).toBe(1500);
  });
  it("returns 0 for VARIABLE without avg", () => {
    expect(normalizeToMonthly(0, "VARIABLE")).toBe(0);
  });
  it("calculates total with empty other incomes", () => {
    expect(calculateTotalMonthlyIncome(50000, [])).toBe(50000);
  });
  it("calculates total with multiple other incomes", () => {
    const total = calculateTotalMonthlyIncome(50000, [
      { amount: 5000, frequency: "MENSUAL" },
      { amount: 1000, frequency: "QUINCENAL" },
    ]);
    expect(total).toBe(57000);
  });
});
