import { fmtLocal, fmtMoneyExact, fmtUsd } from "@/app/market-intel/lib/formatters";

describe("MEE formatters", () => {
  test("fmtLocal formats DOP millions with explicit locale", () => {
    expect(fmtLocal(54599000000, "RD$", "es-DO")).toMatch(/^RD\$54\.6MM$/);
  });

  test("fmtUsd formats USD millions", () => {
    expect(fmtUsd(880600000)).toMatch(/^US\$880\.6M$/);
  });

  test("fmtLocal formats COP with explicit tenant context", () => {
    expect(fmtLocal(4100000, "COP$", "es-CO")).toMatch(/^COP\$4[,.]1M$/);
  });

  test("missing currency never falls back to RD$ or any other symbol", () => {
    expect(fmtLocal(4_100_000)).toBe("—");
    expect(fmtLocal(4_100_000, null, "es-AR")).toBe("—");
    expect(fmtMoneyExact(1_000)).toBe("—");
  });

  test("null numeric values render em dash instead of zero", () => {
    expect(fmtLocal(null, "RD$", "es-DO")).toBe("—");
    expect(fmtMoneyExact(null, "$", "en-US")).toBe("—");
    expect(fmtUsd(undefined)).toBe("—");
  });
});
