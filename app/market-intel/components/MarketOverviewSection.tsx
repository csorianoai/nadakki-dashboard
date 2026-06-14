"use client";

import type { MarketOverview } from "../lib/types";
import { formatGrowthRatePct, formatMarketIntelCurrency } from "../lib/formatCurrency";
import { InstitutionChart } from "./InstitutionChart";

interface MarketOverviewSectionProps {
  overview?: MarketOverview;
  currency?: string;
}

function formatMarketSize(value: number | null | undefined, currency: string): string {
  if (value == null || Number.isNaN(value)) return "—";
  return formatMarketIntelCurrency(value, currency);
}

export function MarketOverviewSection({ overview, currency = "DOP" }: MarketOverviewSectionProps) {
  if (!overview) return null;

  const shares = overview.institution_shares ?? [];
  const keyPlayers = Array.isArray(overview.key_players) ? overview.key_players.filter(Boolean) : [];
  const regulatory =
    typeof overview.regulatory_environment === "string" && overview.regulatory_environment.trim()
      ? overview.regulatory_environment.trim()
      : null;

  const localSize = formatMarketSize(overview.market_size_local, currency);
  const usdSize = formatMarketSize(overview.market_size_usd, "USD");
  const growth = formatGrowthRatePct(overview.growth_rate_pct);

  return (
    <section
      className="rounded-forge-lg border border-forgeGray-200 bg-forgeSurface-card p-4 shadow-forge-xs"
      aria-labelledby="market-overview-title"
    >
      <h3 id="market-overview-title" className="font-display text-forge-md font-semibold text-forgeGray-800">
        Panorama de mercado
      </h3>

      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken px-3 py-2">
          <dt className="text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">
            Tamaño de mercado (local)
          </dt>
          <dd className="mt-1 font-forgeMono text-forge-sm text-forgeGray-800">{localSize}</dd>
        </div>
        <div className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken px-3 py-2">
          <dt className="text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">
            Tamaño de mercado (USD)
          </dt>
          <dd className="mt-1 font-forgeMono text-forge-sm text-forgeGray-800">{usdSize}</dd>
        </div>
        <div className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken px-3 py-2">
          <dt className="text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">
            Tasa de crecimiento
          </dt>
          <dd className="mt-1 font-forgeMono text-forge-sm text-forgeGray-800">{growth}</dd>
        </div>
        <div className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken px-3 py-2 sm:col-span-2">
          <dt className="text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">
            Jugadores clave
          </dt>
          <dd className="mt-2">
            {keyPlayers.length > 0 ? (
              <ul className="flex flex-wrap gap-2">
                {keyPlayers.map((player) => (
                  <li
                    key={player}
                    className="rounded-forge-pill border border-forgeGray-200 bg-white px-2.5 py-0.5 text-forge-xs text-forgeGray-700"
                  >
                    {player}
                  </li>
                ))}
              </ul>
            ) : (
              <span className="text-forge-sm text-forgeGray-500">—</span>
            )}
          </dd>
        </div>
        <div className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken px-3 py-2 sm:col-span-2">
          <dt className="text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">
            Entorno regulatorio
          </dt>
          <dd className="mt-1 text-forge-sm text-forgeGray-800">{regulatory ?? "—"}</dd>
        </div>
      </dl>

      {shares.length > 0 ? (
        <div className="mt-4 border-t border-forgeGray-100 pt-4">
          <InstitutionChart shares={shares} currency={currency} />
        </div>
      ) : null}
    </section>
  );
}
