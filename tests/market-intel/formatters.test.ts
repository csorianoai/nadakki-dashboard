import { fmtLocal, fmtUsd } from "@/app/market-intel/lib/formatters";

describe("MEE formatters", () => {
  test("fmtLocal formats DOP millions", () => {
    expect(fmtLocal(54599000000, "RD$")).toMatch(/^RD\$54\.6MM$/);
  });

  test("fmtUsd formats USD millions", () => {
    expect(fmtUsd(880600000)).toMatch(/^US\$880\.6M$/);
  });

  test("fmtLocal formats COP thousands", () => {
    expect(fmtLocal(4100000, "COP$")).toMatch(/^COP\$4\.1M$/);
  });

  test("null values render em dash", () => {
    expect(fmtLocal(null, "RD$")).toBe("—");
    expect(fmtUsd(undefined)).toBe("—");
  });
});
