import {
  filterFindings,
  filterInstitutionShares,
  scaleMarketSizeForSegment,
} from "@/app/market-intel/lib/mee-filters";
import { snapshotFull } from "@/app/market-intel/lib/__fixtures__/snapshotFull";

describe("mee-filters", () => {
  const shares = snapshotFull.market_overview.institution_shares ?? [];

  it("filterInstitutionShares restringe por tier", () => {
    const tier1 = filterInstitutionShares(shares, { tier: "Tier1" });
    expect(tier1).toHaveLength(2);
    expect(tier1.every((s) => s.tier === "Tier1")).toBe(true);
  });

  it("scaleMarketSizeForSegment reduce cartera en segmento usados", () => {
    const base = snapshotFull.market_overview.market_size_local ?? 0;
    expect(scaleMarketSizeForSegment(base, "usados")).toBeLessThan(base);
    expect(scaleMarketSizeForSegment(base, "all")).toBe(base);
  });

  it("filterFindings aplica confianza y tier institucional", () => {
    const altoOnly = filterFindings(
      snapshotFull.findings,
      { segment: "all", confidence: "alto", tier: "all" },
      shares,
    );
    expect(altoOnly).toHaveLength(1);
    expect(altoOnly[0]?.confidence).toBe("alto");
  });
});
