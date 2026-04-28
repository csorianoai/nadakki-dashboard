import { Building2 } from "lucide-react";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";

export function BankDashboardHero() {
  return (
    <ForgeCard className="overflow-hidden border-forge-primary/20 bg-gradient-to-br from-forge-surface via-forge-surface to-forge-primary/10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.18em] text-forge-primary">Portal bancario</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-forge-text md:text-4xl">Mesa de decisiones CrediCefi</h1>
          <p className="mt-2 max-w-2xl text-forge-text-muted">
            Bandeja priorizada, decisiones auditables, compliance Ley 172-13 y analytics ejecutivos para comité de riesgo.
          </p>
        </div>
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-forge-primary/15 text-forge-primary">
          <Building2 className="h-8 w-8" />
        </div>
      </div>
    </ForgeCard>
  );
}
