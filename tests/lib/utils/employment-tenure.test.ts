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
  });
  it("formats months correctly under 1 year", () => {
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const result = calculateEmploymentTenure(sixMonthsAgo);
    expect(result.years).toBe(0);
    expect(result.display).toContain("meses");
  });
  it("handles less than 1 month", () => {
    const today = new Date();
    const result = calculateEmploymentTenure(today);
    expect(result.display).toBe("Menos de 1 mes");
  });
});
