"use client";

import type { SnapshotPayload } from "../lib/types";
import { MetricsStrip } from "./MetricsStrip";
import { InstitutionChart } from "./InstitutionChart";
import { SourcesList } from "./SourcesList";
import { FindingsPanel } from "./FindingsPanel";
import { EntryStrategySection } from "./EntryStrategySection";
import { PricingProposalSection } from "./PricingProposalSection";

interface IntelligenceViewProps {
  snapshot: SnapshotPayload;
  currency?: string;
}

export function IntelligenceView({ snapshot, currency = "DOP" }: IntelligenceViewProps) {
  const overview = snapshot.market_overview ?? {};
  const shares = overview.institution_shares ?? [];
  const priorityTiers = overview.priority_tiers ?? [];
  const wedgeCallout =
    typeof overview.wedge_callout === "string" ? overview.wedge_callout : null;
  const headline = typeof overview.headline === "string" ? overview.headline : null;
  const totalMarketRd =
    typeof overview.total_market_rd === "number" ? overview.total_market_rd : undefined;

  return (
    <div className="space-y-6">
      {headline ? (
        <p className="font-display text-forge-lg font-semibold text-forgeGray-800">{headline}</p>
      ) : null}

      <MetricsStrip
        summary={snapshot.sources_summary}
        totalMarketValue={totalMarketRd}
        currency={currency}
      />

      {wedgeCallout ? (
        <aside
          className="rounded-forge-lg border-l-4 border-[var(--mee-accent)] bg-[var(--mee-accent-soft)] px-4 py-3"
          aria-label="Cuña de mercado"
        >
          <p className="text-forge-xs font-bold uppercase tracking-wide text-[var(--mee-accent-strong)]">
            Cuña de oportunidad
          </p>
          <p className="mt-1 text-forge-sm text-forgeGray-800">{wedgeCallout}</p>
        </aside>
      ) : null}

      {shares.length > 0 ? <InstitutionChart shares={shares} currency={currency} /> : null}

      {priorityTiers.length > 0 ? (
        <section
          className="rounded-forge-lg border border-forgeGray-200 bg-forgeSurface-card p-4 shadow-forge-xs"
          aria-labelledby="priority-tiers-title"
        >
          <h3 id="priority-tiers-title" className="font-display text-forge-md font-semibold text-forgeGray-800">
            Tiers de prioridad
          </h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-3">
            {priorityTiers.map((tier) => (
              <div
                key={tier.tier}
                className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken px-3 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-forgeMono text-forge-sm font-bold text-[var(--mee-accent-strong)]">
                    {tier.tier}
                  </span>
                  <span className="rounded-forge-pill bg-forgeGray-100 px-2 py-0.5 font-forgeMono text-forge-xs text-forgeGray-700">
                    {tier.count}
                  </span>
                </div>
                <p className="mt-1 text-forge-sm font-medium text-forgeGray-800">{tier.label}</p>
                {tier.description ? (
                  <p className="mt-0.5 text-forge-xs text-forgeGray-500">{tier.description}</p>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <SourcesList findings={snapshot.findings} />
      <FindingsPanel findings={snapshot.findings} />
      <EntryStrategySection entryStrategy={snapshot.entry_strategy} />
      <PricingProposalSection pricingProposal={snapshot.pricing_proposal} />
    </div>
  );
}
