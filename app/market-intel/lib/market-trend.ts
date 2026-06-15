/** Synthetic 5-year market trend — ported from design-system/mee/mee-data.jsx. */

export interface MarketTrendPoint {
  year: number;
  size: number;
  growth: number;
}

export function deriveMarketTrend(
  marketSizeLocal: number,
  growthRatePct: number,
): MarketTrendPoint[] {
  const end = marketSizeLocal;
  const g = growthRatePct / 100;
  const yrs = [2020, 2021, 2022, 2023, 2024];
  let v = end;
  const back: number[] = [];
  for (let i = yrs.length - 1; i >= 0; i--) {
    back[i] = v;
    v = v / (1 + (i === yrs.length - 1 ? g : g - 0.01 * (yrs.length - 1 - i)));
  }
  return yrs.map((y, i) => ({
    year: y,
    size: Math.round(back[i]),
    growth:
      i === 0
        ? 9.1
        : +(((back[i] / back[i - 1]) - 1) * 100).toFixed(1),
  }));
}
