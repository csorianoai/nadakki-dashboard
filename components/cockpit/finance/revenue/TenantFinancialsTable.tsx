"use client";

import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { cockpitDataSourceToBadgeLevel } from "@/lib/cockpit/finance-v3/data-source";
import { formatCockpitMoney } from "@/lib/cockpit/finance-v3/format";
import type { TenantFinancialsListEnvelope } from "@/lib/cockpit/finance-v3/contracts/finance";

export function TenantFinancialsTable({
  envelope,
  locale,
  currency,
}: {
  envelope: TenantFinancialsListEnvelope;
  locale: string;
  currency: string;
}) {
  const badge = cockpitDataSourceToBadgeLevel(envelope.data_source);

  return (
    <div className="rounded-xl border border-cockpit-border bg-cockpit-surface p-4" data-testid="tenant-financials-table">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-cockpit-text">Tenants — contribución MRR</h2>
        <DataTruthBadge level={badge} />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-xs uppercase text-cockpit-muted">
            <tr>
              <th className="px-3 py-2 text-left">Tenant</th>
              <th className="px-3 py-2 text-left">Plan</th>
              <th className="px-3 py-2 text-right">MRR</th>
              <th className="px-3 py-2 text-left">Estado</th>
            </tr>
          </thead>
          <tbody>
            {envelope.data.items.map((row) => (
              <tr key={row.tenant_id} className="border-t border-cockpit-border">
                <td className="px-3 py-2">{row.tenant_name}</td>
                <td className="px-3 py-2">{row.plan_name ?? "—"}</td>
                <td className="px-3 py-2 text-right font-mono tabular-nums">
                  {formatCockpitMoney(row.mrr_contribution, locale, currency, envelope.data_source)}
                </td>
                <td className="px-3 py-2 capitalize">{row.subscription_status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
