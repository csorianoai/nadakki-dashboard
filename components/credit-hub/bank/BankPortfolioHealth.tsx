import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";

export function BankPortfolioHealth({ data }: { data?: Record<string, unknown> }) {
  const distribution = (data?.score_distribution ?? {}) as Record<string, number>;
  return (
    <ForgeCard>
      <h3 className="mb-4 font-semibold text-forge-text">Salud de cartera</h3>
      <div className="grid grid-cols-2 gap-3">
        {Object.entries(distribution).map(([band, count]) => (
          <div key={band} className="rounded-xl bg-forge-surface-elevated p-3">
            <p className="text-xs text-forge-text-muted">Score {band}</p>
            <p className="font-display text-2xl font-bold text-forge-text">{count}</p>
          </div>
        ))}
      </div>
    </ForgeCard>
  );
}
