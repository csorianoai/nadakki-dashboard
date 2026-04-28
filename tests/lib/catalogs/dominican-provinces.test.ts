import { DOMINICAN_PROVINCES } from "@/lib/credit/catalogs/dominican-provinces";

describe("DOMINICAN_PROVINCES", () => {
  test("contains 32 provinces", () => {
    expect(DOMINICAN_PROVINCES).toHaveLength(32);
  });

  test("every province has at least one municipality", () => {
    for (const province of DOMINICAN_PROVINCES) {
      expect(province.municipalities.length).toBeGreaterThan(0);
    }
  });

  test("municipalities are unique per province", () => {
    for (const province of DOMINICAN_PROVINCES) {
      expect(new Set(province.municipalities).size).toBe(province.municipalities.length);
    }
  });
});
