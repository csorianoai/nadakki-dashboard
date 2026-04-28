import { normalizeToMonthly, calculateTotalMonthlyIncome } from "@/lib/credit/utils/income-normalizer";

describe("income-normalizer", () => {
  describe("normalizeToMonthly", () => {
    it("MENSUAL identity", () => {
      expect(normalizeToMonthly(1000, "MENSUAL")).toBe(1000);
    });
    it("QUINCENAL multiplied by 2", () => {
      expect(normalizeToMonthly(500, "QUINCENAL")).toBe(1000);
    });
    it("SEMANAL multiplied by 4.33", () => {
      expect(normalizeToMonthly(250, "SEMANAL")).toBeCloseTo(1082.5, 1);
    });
    it("TRIMESTRAL divided by 3", () => {
      expect(normalizeToMonthly(3000, "TRIMESTRAL")).toBeCloseTo(1000, 2);
    });
    it("ANUAL divided by 12", () => {
      expect(normalizeToMonthly(12000, "ANUAL")).toBe(1000);
    });
    it("VARIABLE uses provided average", () => {
      expect(normalizeToMonthly(0, "VARIABLE", 1500)).toBe(1500);
    });
    it("VARIABLE returns 0 without average", () => {
      expect(normalizeToMonthly(0, "VARIABLE")).toBe(0);
    });
  });

  describe("calculateTotalMonthlyIncome", () => {
    it("returns base salary with empty array", () => {
      expect(calculateTotalMonthlyIncome(50000, [])).toBe(50000);
    });
    it("returns base salary with null/undefined", () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      expect(calculateTotalMonthlyIncome(50000, null as any)).toBe(50000);
    });
    it("sums multiple sources correctly", () => {
      const total = calculateTotalMonthlyIncome(50000, [
        { amount: 5000, frequency: "MENSUAL" },
        { amount: 1000, frequency: "QUINCENAL" },
      ]);
      expect(total).toBe(57000);
    });
    it("handles VARIABLE source with avg", () => {
      const total = calculateTotalMonthlyIncome(40000, [
        { amount: 0, frequency: "VARIABLE", variable_avg_6_months: 8000 },
      ]);
      expect(total).toBe(48000);
    });
  });
});
