"use client";

import type { DealerTier, PricingPlan, PricingProposal } from "../lib/types";
import { formatMarketIntelCurrency } from "../lib/formatCurrency";

interface PricingProposalSectionProps {
  pricingProposal?: PricingProposal;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function asPlan(value: unknown): PricingPlan | null {
  if (!isRecord(value)) return null;
  const name = typeof value.name === "string" ? value.name : null;
  if (!name) return null;
  return value as PricingPlan;
}

function asDealerTier(value: unknown): DealerTier | null {
  if (!isRecord(value)) return null;
  const tier = typeof value.tier === "string" ? value.tier : null;
  if (!tier) return null;
  return value as DealerTier;
}

function planExtraFields(plan: PricingPlan): Array<[string, unknown]> {
  return Object.entries(plan).filter(
    ([key, value]) =>
      !["name", "setup_fee", "per_application_fee"].includes(key) &&
      value != null &&
      value !== "" &&
      typeof value !== "object"
  );
}

function dealerExtraFields(tier: DealerTier): Array<[string, unknown]> {
  return Object.entries(tier).filter(
    ([key, value]) =>
      !["tier", "monthly_fee", "features"].includes(key) &&
      value != null &&
      value !== "" &&
      typeof value !== "object" &&
      !Array.isArray(value)
  );
}

export function PricingProposalSection({ pricingProposal }: PricingProposalSectionProps) {
  if (!pricingProposal || Object.keys(pricingProposal).length === 0) return null;

  const currency = typeof pricingProposal.currency === "string" ? pricingProposal.currency : "USD";
  const plans = Array.isArray(pricingProposal.plans)
    ? pricingProposal.plans.map(asPlan).filter((p): p is PricingPlan => p !== null)
    : [];
  const dealerTiers = Array.isArray(pricingProposal.dealer_tiers)
    ? pricingProposal.dealer_tiers.map(asDealerTier).filter((t): t is DealerTier => t !== null)
    : [];

  const metaEntries: Array<[string, string]> = [];
  if (pricingProposal.tier) metaEntries.push(["Nivel", String(pricingProposal.tier)]);
  if (pricingProposal.currency) metaEntries.push(["Moneda", String(pricingProposal.currency)]);
  if (typeof pricingProposal.fx_to_usd === "number") {
    metaEntries.push(["FX a USD", pricingProposal.fx_to_usd.toLocaleString("es-DO")]);
  }
  if (pricingProposal.validation_status) {
    metaEntries.push(["Estado", String(pricingProposal.validation_status)]);
  }

  return (
    <section
      className="rounded-forge-lg border border-forgeGray-200 bg-forgeSurface-card p-4 shadow-forge-xs"
      aria-labelledby="pricing-proposal-title"
    >
      <h3 id="pricing-proposal-title" className="font-display text-forge-md font-semibold text-forgeGray-800">
        Propuesta de precios
      </h3>

      {metaEntries.length > 0 ? (
        <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {metaEntries.map(([label, value]) => (
            <div key={label} className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken px-3 py-2">
              <dt className="text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">{label}</dt>
              <dd className="mt-1 font-forgeMono text-forge-sm text-forgeGray-800">{value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="mt-4">
        <h4 className="text-forge-xs font-bold uppercase tracking-wide text-forgeGray-500">Planes</h4>
        {plans.length === 0 ? (
          <p className="mt-2 text-forge-sm text-forgeGray-500">Sin planes configurados aún</p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {plans.map((plan) => (
              <li
                key={plan.name}
                className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken px-3 py-3"
              >
                <p className="font-display text-forge-sm font-semibold text-forgeGray-800">{plan.name}</p>
                <dl className="mt-2 space-y-1 text-forge-sm text-forgeGray-700">
                  {typeof plan.setup_fee === "number" ? (
                    <div className="flex justify-between gap-2">
                      <dt className="text-forgeGray-500">Setup</dt>
                      <dd className="font-forgeMono">{formatMarketIntelCurrency(plan.setup_fee, currency)}</dd>
                    </div>
                  ) : null}
                  {typeof plan.per_application_fee === "number" ? (
                    <div className="flex justify-between gap-2">
                      <dt className="text-forgeGray-500">Por solicitud</dt>
                      <dd className="font-forgeMono">
                        {formatMarketIntelCurrency(plan.per_application_fee, currency)}
                      </dd>
                    </div>
                  ) : null}
                  {planExtraFields(plan).map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-2">
                      <dt className="text-forgeGray-500">{key.replace(/_/g, " ")}</dt>
                      <dd className="font-forgeMono">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-4">
        <h4 className="text-forge-xs font-bold uppercase tracking-wide text-forgeGray-500">Dealer tiers</h4>
        {dealerTiers.length === 0 ? (
          <p className="mt-2 text-forge-sm text-forgeGray-500">Sin tiers de dealer configurados aún</p>
        ) : (
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {dealerTiers.map((dealerTier) => (
              <li
                key={dealerTier.tier}
                className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken px-3 py-3"
              >
                <p className="font-forgeMono text-forge-sm font-bold text-[var(--mee-accent-strong)]">
                  {dealerTier.tier}
                </p>
                {typeof dealerTier.monthly_fee === "number" ? (
                  <p className="mt-1 font-forgeMono text-forge-sm text-forgeGray-800">
                    {formatMarketIntelCurrency(dealerTier.monthly_fee, currency)}
                    <span className="text-forge-xs text-forgeGray-500"> / mes</span>
                  </p>
                ) : null}
                {Array.isArray(dealerTier.features) && dealerTier.features.length > 0 ? (
                  <ul className="mt-2 list-inside list-disc text-forge-xs text-forgeGray-600">
                    {dealerTier.features.map((feature) => (
                      <li key={feature}>{feature}</li>
                    ))}
                  </ul>
                ) : null}
                {dealerExtraFields(dealerTier).map(([key, value]) => (
                  <p key={key} className="mt-1 text-forge-xs text-forgeGray-600">
                    <span className="font-semibold text-forgeGray-500">{key.replace(/_/g, " ")}:</span>{" "}
                    {String(value)}
                  </p>
                ))}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
