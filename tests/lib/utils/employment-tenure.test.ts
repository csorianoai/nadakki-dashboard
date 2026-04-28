import { calculateEmploymentTenure } from "@/lib/credit/utils/employment-tenure";

describe("employment-tenure", () => {
  it("returns invalid for null", () => {
    const result = calculateEmploymentTenure(null);
    expect(result.isValid).toBe(false);
    expect(result.display).toBe("");
  });

  it("returns invalid for future date", () => {
    const future = new Date();
    future.setFullYear(future.getFullYear() + 1);
    const result = calculateEmploymentTenure(future);
    expect(result.isValid).toBe(false);
    expect(result.display).toBe("Fecha inválida");
  });

  it("calculates 5 years correctly", () => {
    const fiveYearsAgo = new Date();
    fiveYearsAgo.setFullYear(fiveYearsAgo.getFullYear() - 5);
    const result = calculateEmploymentTenure(fiveYearsAgo);
    expect(result.years).toBe(5);
    expect(result.display).toContain("5 años");
    expect(result.isValid).toBe(true);
  });

  it("formats months correctly under 1 year", () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const result = calculateEmploymentTenure(sixMonthsAgo);
    expect(result.years).toBe(0);
    expect(result.display).toMatch(/meses/);
  });

  it("handles less than 1 month", () => {
    const today = new Date();
    const result = calculateEmploymentTenure(today);
    expect(result.display).toBe("Menos de 1 mes");
  });

  describe("with fixed system time 2026-06-15", () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-06-15T12:00:00Z"));
    });
    afterAll(() => {
      jest.useRealTimers();
    });

    it("accepts ISO string input", () => {
      const result = calculateEmploymentTenure("2020-01-15");
      expect(result.isValid).toBe(true);
      expect(result.years).toBeGreaterThan(0);
    });

    it("handles year + months combo", () => {
      const start = new Date("2024-03-15T12:00:00Z");
      const result = calculateEmploymentTenure(start);
      expect(result.years).toBe(2);
      expect(result.months).toBe(3);
      expect(result.display).toMatch(/2 años, 3 meses/);
    });
  });
});
