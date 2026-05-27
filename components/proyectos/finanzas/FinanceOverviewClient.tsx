"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Landmark } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { getFinanceOverview } from "@/app/hooks/useProyectos";
import { FinanzasPageShell } from "@/components/proyectos/finanzas/FinanzasPageShell";
import { FinanzasLoadingState } from "@/components/proyectos/finanzas/LoadingState";
import { FinanceOverviewCards } from "@/components/proyectos/finanzas/FinanceOverviewCards";
import { EconomicEventsTimeline } from "@/components/proyectos/finanzas/EconomicEventsTimeline";
import { AmountDisplay } from "@/components/proyectos/finanzas/AmountDisplay";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";
import type { FinanceOverview } from "@/types/finanzas";

export function FinanceOverviewClient({ proyectoId }: { proyectoId: string }) {
  const tenantId = useForgeProjectsTenantId();
  const [data, setData] = useState<FinanceOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      setData(await getFinanceOverview(tenantId, proyectoId));
    } finally {
      setLoading(false);
    }
  }, [tenantId, proyectoId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!tenantId) {
    return (
      <GlassCard hover={false} className="border border-amber-500/35 p-6 text-sm text-amber-100">
        Selecciona un tenant activo para ver finanzas.
      </GlassCard>
    );
  }

  return (
    <FinanzasPageShell
      proyectoId={proyectoId}
      title="Overview financiero"
      description="KPIs de presupuesto, compromiso, facturación y pagos del proyecto."
      icon={<Landmark className="h-10 w-10" aria-hidden />}
    >
      {loading || !data ? (
        <FinanzasLoadingState rows={8} />
      ) : (
        <div className="space-y-8">
          <FinanceOverviewCards kpis={data.kpis} />
          <div className="grid gap-6 lg:grid-cols-2">
            <GlassCard hover={false} className="border border-white/10 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Eventos recientes</h2>
              <div className="mt-4">
                <EconomicEventsTimeline events={data.recent_events} compact />
              </div>
            </GlassCard>
            <GlassCard hover={false} className="border border-white/10 p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400">Alertas</h2>
              <ul className="mt-4 space-y-3">
                {data.alerts.map((a) => (
                  <li
                    key={a.id}
                    className={`rounded-lg border p-3 ${
                      a.severity === "error"
                        ? "border-rose-500/30 bg-rose-500/10"
                        : a.severity === "warning"
                          ? "border-amber-500/30 bg-amber-500/10"
                          : "border-sky-500/30 bg-sky-500/10"
                    }`}
                  >
                    <div className="flex gap-2">
                      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden />
                      <div>
                        <p className="text-sm font-semibold text-white">{a.title}</p>
                        <p className="mt-1 text-xs text-zinc-400">{a.description}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-xs text-zinc-500">
                Saldo pendiente total: <AmountDisplay amount={data.kpis.saldo_pendiente_usd} />
              </p>
            </GlassCard>
          </div>
        </div>
      )}
    </FinanzasPageShell>
  );
}
