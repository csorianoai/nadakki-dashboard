import { calculateAge, formatTenure, parseDateInput } from "@/lib/credit/utils/age";

describe("age utilities", () => {
  test("calculates age respecting month and day", () => {
    const today = new Date();
    const birth = new Date(today.getFullYear() - 30, today.getMonth(), today.getDate());
    expect(calculateAge(birth)).toBe(30);
  });

  test("parses invalid date as null", () => {
    expect(parseDateInput("")).toBeNull();
    expect(parseDateInput("invalid")).toBeNull();
  });

  test("formats tenure in years and months", () => {
    const today = new Date();
    const start = new Date(today.getFullYear() - 2, today.getMonth(), today.getDate());
    expect(formatTenure(start)).toContain("2 años");
  });
});
