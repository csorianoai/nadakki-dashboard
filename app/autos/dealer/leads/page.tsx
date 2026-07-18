"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DemoModeBadge } from "@/components/search/DemoModeBadge";
import { LeadCard } from "@/components/dealer/LeadCard";
import { getDealerId, getLeadsPriority, markLeadContacted } from "@/lib/api/dealer-leads";
import { getLeadStats } from "@/lib/dealer/leads-mock";
import type { DealerLead } from "@/lib/dealer/leads-mock";
import { VEHICLES_SEED } from "@/lib/vehicles";
import { cn } from "@/lib/utils";

export default function DealerLeadsPage() {
  const [leads, setLeads] = useState<DealerLead[]>([]);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [vehicleFilter, setVehicleFilter] = useState<number | "all">("all");
  const [tierFilter, setTierFilter] = useState<"all" | "hot" | "warm" | "cold">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "new" | "contacted" | "closed">("all");
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const res = await getLeadsPriority(getDealerId(), {
      vehicleId: vehicleFilter === "all" ? undefined : vehicleFilter,
      tier: tierFilter,
      status: statusFilter,
      search: search || undefined,
    });
    setLeads(res.data);
    setDemoMode(!res.fromBackend);
    setLoading(false);
  }, [vehicleFilter, tierFilter, statusFilter, search]);

  useEffect(() => {
    void load();
  }, [load]);

  const stats = useMemo(() => getLeadStats(leads), [leads]);

  return (
    <main>
      <header className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-manrope text-2xl font-extrabold text-nk-fg">Leads Prioritarios</h1>
          <DemoModeBadge visible={demoMode} />
        </div>
        <p className="mt-1 text-nk-fg-muted">
          AI clasificó tus leads por probabilidad de conversión
        </p>
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <Stat dot="bg-red-500" label={`${stats.hot} leads hot`} />
          <Stat dot="bg-yellow-500" label={`${stats.warm} leads warm`} />
          <Stat dot="bg-sky-400" label={`${stats.cold} leads cold`} />
          <span className="text-nk-fg-muted">{stats.total} leads totales esta semana</span>
        </div>
      </header>

      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={vehicleFilter}
          onChange={(e) =>
            setVehicleFilter(e.target.value === "all" ? "all" : Number(e.target.value))
          }
          className="rounded-r-sm border border-nk-border bg-nk-surface-2 px-3 py-2 text-sm"
        >
          <option value="all">Todos los vehículos</option>
          {VEHICLES_SEED.slice(0, 8).map((v) => (
            <option key={v.id} value={v.id}>
              {v.year} {v.make} {v.model}
            </option>
          ))}
        </select>
        <select
          value={tierFilter}
          onChange={(e) => setTierFilter(e.target.value as typeof tierFilter)}
          className="rounded-r-sm border border-nk-border bg-nk-surface-2 px-3 py-2 text-sm"
        >
          <option value="all">Todos los scores</option>
          <option value="hot">Hot 90+</option>
          <option value="warm">Warm 60-89</option>
          <option value="cold">Cold &lt;60</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="rounded-r-sm border border-nk-border bg-nk-surface-2 px-3 py-2 text-sm"
        >
          <option value="all">Todos los estados</option>
          <option value="new">Nuevo</option>
          <option value="contacted">Contactado</option>
          <option value="closed">Cerrado</option>
        </select>
        <input
          type="search"
          placeholder="Buscar nombre o teléfono"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="min-w-[200px] flex-1 rounded-r-sm border border-nk-border bg-nk-surface-2 px-3 py-2 text-sm"
        />
      </div>

      {loading ? (
        <p className="text-sm text-nk-fg-muted">Cargando leads…</p>
      ) : (
        <div className="space-y-4">
          {leads.map((lead) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              onContact={() => {
                window.open(
                  `https://wa.me/${lead.phone.replace(/\D/g, "")}?text=${encodeURIComponent(`Hola ${lead.name}, vi tu interés en ${lead.vehicleName} en Nadakki.`)}`,
                  "_blank",
                );
              }}
              onMarkContacted={() => {
                markLeadContacted(lead.id);
                toast.success("Lead marcado como contactado");
                void load();
              }}
            />
          ))}
          {leads.length === 0 ? (
            <p className="text-sm text-nk-fg-muted">No hay leads con estos filtros.</p>
          ) : null}
        </div>
      )}
    </main>
  );
}

function Stat({ dot, label }: { dot: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2 font-semibold text-nk-fg">
      <span className={cn("h-2 w-2 rounded-full", dot)} aria-hidden />
      {label}
    </span>
  );
}
