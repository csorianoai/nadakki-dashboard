import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import type { BankDashboardAnalytics } from "@/lib/credit-hub/types/bankDecision";

export function BankDealerRanking({ dealers = [] }: { dealers?: BankDashboardAnalytics["top_dealers"] }) {
  return (
    <ForgeCard>
      <h3 className="mb-4 font-semibold text-forge-text">Top dealers</h3>
      <div className="space-y-3">
        {dealers.length === 0 ? <p className="text-sm text-forge-text-muted">Sin volumen suficiente.</p> : dealers.map((dealer) => (
          <div key={dealer.dealer} className="flex items-center justify-between rounded-xl bg-forge-surface-elevated p-3">
            <div>
              <p className="font-medium text-forge-text">{dealer.dealer}</p>
              <p className="text-xs text-forge-text-muted">{dealer.volume} solicitudes</p>
            </div>
            <p className="font-semibold text-forge-success">{Math.round(dealer.approval_rate * 100)}%</p>
          </div>
        ))}
      </div>
    </ForgeCard>
  );
}
