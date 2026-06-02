import type { FindingsSummary } from "@/types/governance";
import { KpiCard } from "@/components/forge/ui/KpiCard";
import { cn } from "@/lib/utils";

interface Props {
  summary: FindingsSummary;
}

export function GovernanceSummaryCards({ summary }: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      <KpiCard label="Total findings" value={summary.total.toString()} />
      <KpiCard
        label="P0"
        value={summary.p0.toString()}
        className={cn(summary.p0 > 0 && "border-rose-300 bg-rose-50/50")}
      />
      <KpiCard
        label="P1"
        value={summary.p1.toString()}
        className={cn(summary.p1 > 0 && "border-amber-300 bg-amber-50/50")}
      />
      <KpiCard label="P2" value={summary.p2.toString()} />
      <KpiCard label="P3" value={summary.p3.toString()} />
    </div>
  );
}
