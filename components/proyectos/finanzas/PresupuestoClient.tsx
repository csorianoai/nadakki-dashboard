"use client";

import { useCallback, useEffect, useState } from "react";
import { Wallet } from "lucide-react";
import { getBudget, getBudgetVariance } from "@/app/hooks/useProyectos";
import { BudgetEditor } from "@/components/proyectos/finanzas/BudgetEditor";
import { BudgetVariancePanel } from "@/components/proyectos/finanzas/BudgetVariancePanel";
import { FinanzasPageShell } from "@/components/proyectos/finanzas/FinanzasPageShell";
import { FinanzasLoadingState } from "@/components/proyectos/finanzas/LoadingState";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";
import type { BudgetSnapshot, BudgetVarianceReport } from "@/types/finanzas";
import GlassCard from "@/components/ui/GlassCard";

export function PresupuestoClient({ proyectoId }: { proyectoId: string }) {
  const tenantId = useForgeProjectsTenantId();
  const [budget, setBudget] = useState<BudgetSnapshot | null>(null);
  const [variance, setVariance] = useState<BudgetVarianceReport | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const [b, v] = await Promise.all([getBudget(tenantId, proyectoId), getBudgetVariance(tenantId, proyectoId)]);
      setBudget(b);
      setVariance(v);
    } finally {
      setLoading(false);
    }
  }, [tenantId, proyectoId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <FinanzasPageShell
      proyectoId={proyectoId}
      title="Presupuesto"
      description="Editor de envelope, CAPEX, OPEX y contingencia con variance por categoría."
      icon={<Wallet className="h-10 w-10" aria-hidden />}
    >
      {loading || !budget || !variance ? (
        <FinanzasLoadingState />
      ) : (
        <div className="space-y-8">
          <GlassCard hover={false} className="border border-white/10 p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-zinc-400">Editor</h2>
            <BudgetEditor tenantId={tenantId!} projectId={proyectoId} budget={budget} onSaved={() => void load()} />
          </GlassCard>
          <div>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-zinc-400">Variance plan vs real</h2>
            <BudgetVariancePanel report={variance} />
          </div>
        </div>
      )}
    </FinanzasPageShell>
  );
}
