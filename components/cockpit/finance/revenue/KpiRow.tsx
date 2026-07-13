"use client";

import { NetworkHealthCard } from "@/components/cockpit/network/NetworkHealthCard";
import { formatCurrency, formatInteger } from "@/lib/cockpit/format";
import type { FinanceKpisResponse } from "@/lib/cockpit/types-finance";

export function KpiRow({
  data,
  isDemo,
  locale,
  currency,
}: {
  data: FinanceKpisResponse;
  isDemo: boolean;
  locale: string;
  currency: string;
}) {
  const money = (n?: number) => (n != null ? formatCurrency(n, locale, currency) : "—");
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
      <NetworkHealthCard label="MRR total" value={money(data.total_mrr)} isDemo={isDemo} />
      <NetworkHealthCard label="ARR proyectado" value={money(data.arr_projected)} isDemo={isDemo} />
      <NetworkHealthCard
        label="Subs activas"
        value={formatInteger(data.active_subscriptions ?? 0, locale)}
        isDemo={isDemo}
      />
      <NetworkHealthCard
        label="Managed"
        value={formatInteger(data.tenants_managed ?? 0, locale)}
        isDemo={isDemo}
      />
      <NetworkHealthCard
        label="Unmanaged"
        value={formatInteger(data.tenants_unmanaged ?? 0, locale)}
        isDemo={isDemo}
      />
    </div>
  );
}
