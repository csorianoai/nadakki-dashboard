import { deriveMarketTrend } from "@/app/market-intel/lib/market-trend";

describe("deriveMarketTrend", () => {
  it("usa serie 2021-2025 como ventana de tendencia", () => {
    const data = deriveMarketTrend(54_599_000_000, 12.3);
    expect(data.map((d) => d.year)).toEqual([2021, 2022, 2023, 2024, 2025]);
  });
});
