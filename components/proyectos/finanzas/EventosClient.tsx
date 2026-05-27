"use client";

import { useCallback, useEffect, useState } from "react";
import { Activity } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { listEventosEconomicos } from "@/app/hooks/useProyectos";
import { EconomicEventsTimeline } from "@/components/proyectos/finanzas/EconomicEventsTimeline";
import { FilterBar } from "@/components/proyectos/finanzas/FilterBar";
import { FinanzasLoadingState } from "@/components/proyectos/finanzas/LoadingState";
import { FinanzasPageShell } from "@/components/proyectos/finanzas/FinanzasPageShell";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";
import type { EconomicEvent } from "@/types/finanzas";

export function EventosClient({ proyectoId }: { proyectoId: string }) {
  const tenantId = useForgeProjectsTenantId();
  const [events, setEvents] = useState<EconomicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      const res = await listEventosEconomicos(tenantId, proyectoId, {
        search,
        sort_by: "occurred_at",
        sort_dir: "desc",
      });
      setEvents(res.items);
    } finally {
      setLoading(false);
    }
  }, [tenantId, proyectoId, search]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <FinanzasPageShell
      proyectoId={proyectoId}
      title="Eventos económicos"
      description="Timeline de eventos: cotizaciones, OC, facturas y pagos (solo lectura)."
      icon={<Activity className="h-10 w-10" aria-hidden />}
    >
      <FilterBar search={search} onSearchChange={setSearch} />
      {loading ? (
        <FinanzasLoadingState />
      ) : (
        <GlassCard hover={false} className="border border-white/10 p-5">
          <EconomicEventsTimeline events={events} />
        </GlassCard>
      )}
    </FinanzasPageShell>
  );
}
