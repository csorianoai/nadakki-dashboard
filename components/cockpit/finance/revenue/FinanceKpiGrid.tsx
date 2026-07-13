"use client";

import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { cockpitDataSourceToBadgeLevel } from "@/lib/cockpit/finance-v3/data-source";
import { formatCockpitInteger, formatCockpitMoney } from "@/lib/cockpit/finance-v3/format";
import type { FinanceKpisEnvelope } from "@/lib/cockpit/finance-v3/contracts/finance";

export function FinanceKpiGrid({
  envelope,
  locale,
  currency,
}: {
  envelope: FinanceKpisEnvelope;
  locale: string;
  currency: string;
}) {
  const badge = cockpitDataSourceToBadgeLevel(envelope.data_source);
  const d = envelope.data;

  const cards = [
    { label: "MRR total", value: formatCockpitMoney(d.total_mrr, locale, currency, envelope.data_source) },
    { label: "ARR proyectado", value: formatCockpitMoney(d.arr_projected, locale, currency, envelope.data_source) },
    { label: "Suscripciones activas", value: formatCockpitInteger(d.active_subscriptions) },
    { label: "Tenants gestionados", value: formatCockpitInteger(d.tenants_managed) },
    { label: "Tenants sin gestión", value: formatCockpitInteger(d.tenants_unmanaged) },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5" data-testid="finance-kpi-grid">
      {cards.map((c) => (
        <div key={c.label} className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4">
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-[11px] font-medium uppercase tracking-wide text-cockpit-muted">{c.label}</p>
            <DataTruthBadge level={badge} />
          </div>
          <p className="font-cockpitMono text-2xl tabular-nums text-cockpit-text">{c.value}</p>
        </div>
      ))}
    </div>
  );
}
