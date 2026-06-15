import type {
  EntryStrategy,
  EntryStrategyTier,
  Finding,
  InstitutionShare,
  MeeFilters,
  SourcesSummary,
} from "./types";

const SEGMENT_KEYWORDS: Record<Exclude<MeeFilters["segment"], "all">, string[]> = {
  usados: ["usado", "usados"],
  nuevos: ["nuevo", "nuevos"],
  comercial: ["comercial", "flota"],
};

const SEGMENT_TO_TARGET: Record<Exclude<MeeFilters["segment"], "all">, string> = {
  usados: "vehiculos_usados",
  nuevos: "vehiculos_nuevos",
  comercial: "comercial",
};

/** Segment share of auto portfolio (SIB DO pack — used_vehicle_share_pct ≈ 62.4%). */
const SEGMENT_SIZE_FACTOR: Record<Exclude<MeeFilters["segment"], "all">, number> = {
  usados: 0.624,
  nuevos: 0.376,
  comercial: 0.08,
};

export function matchesSegmentText(text: string, segment: MeeFilters["segment"]): boolean {
  if (segment === "all") return true;
  const lower = text.toLowerCase();
  return SEGMENT_KEYWORDS[segment].some((kw) => lower.includes(kw));
}

export function institutionNamesForTier(
  shares: InstitutionShare[],
  tier: MeeFilters["tier"],
): string[] {
  if (tier === "all") return shares.map((s) => s.name);
  return shares.filter((s) => s.tier === tier).map((s) => s.name);
}

export function filterInstitutionShares(
  shares: InstitutionShare[],
  filters: Pick<MeeFilters, "tier">,
): InstitutionShare[] {
  if (filters.tier === "all") return shares;
  return shares.filter((s) => s.tier === filters.tier);
}

export function scaleMarketSizeForSegment(
  marketSizeLocal: number,
  segment: MeeFilters["segment"],
): number {
  if (segment === "all") return marketSizeLocal;
  return Math.round(marketSizeLocal * SEGMENT_SIZE_FACTOR[segment]);
}

export function filterFindings(
  findings: Finding[],
  filters: MeeFilters,
  shares: InstitutionShare[] = [],
): Finding[] {
  const tierNames =
    filters.tier === "all" ? [] : institutionNamesForTier(shares, filters.tier);

  return findings.filter((f) => {
    if (filters.confidence !== "all" && f.confidence !== filters.confidence) return false;

    const text = `${f.summary} ${f.source_name}`;
    if (!matchesSegmentText(text, filters.segment)) return false;

    if (filters.tier !== "all" && tierNames.length > 0) {
      const lower = text.toLowerCase();
      const matchesTierInstitution = tierNames.some((name) => {
        const token = name.toLowerCase().split(/\s+/)[0] ?? "";
        return token.length > 2 && lower.includes(token);
      });
      if (!matchesTierInstitution) return false;
    }

    return true;
  });
}

export function deriveSourcesSummary(findings: Finding[]): SourcesSummary {
  const by_level: Record<string, number> = {};
  const by_confidence: Record<string, number> = {};
  for (const f of findings) {
    by_level[f.source_level] = (by_level[f.source_level] ?? 0) + 1;
    by_confidence[f.confidence] = (by_confidence[f.confidence] ?? 0) + 1;
  }
  return { total: findings.length, by_level, by_confidence };
}

export function filterEntryStrategyTiers(
  strategy: EntryStrategy,
  filters: MeeFilters,
): EntryStrategyTier[] {
  if (
    filters.segment !== "all" &&
    strategy.target_segment !== SEGMENT_TO_TARGET[filters.segment]
  ) {
    return [];
  }
  if (filters.tier === "all") return strategy.institution_tiers;
  return strategy.institution_tiers.filter((t) => t.tier === filters.tier);
}
