"use client";

import { useCallback, useEffect, useState } from "react";
import { CalendarRange, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { Button, Select } from "@/components/forge";
import {
  ContableApiError,
  listPeriodos,
  lockPeriodo,
  reopenPeriodo,
} from "@/app/hooks/contable";
import { ContablePageShell } from "@/components/contable/ContablePageShell";
import { PeriodoStatusBadge } from "@/components/contable/ContableBadges";
import { JustificationModal } from "@/components/proyectos/finanzas/JustificationModal";
import { useContableTenantId } from "@/components/contable/useContableTenantId";
import type { PeriodoContable } from "@/types/contable";

export function PeriodosClient() {
  const tenantId = useContableTenantId();
  const [year, setYear] = useState(new Date().getFullYear());
  const [rows, setRows] = useState<PeriodoContable[]>([]);
  const [loading, setLoading] = useState(true);
  const [reopenTarget, setReopenTarget] = useState<PeriodoContable | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    try {
      setRows(await listPeriodos(tenantId, year));
    } catch (e) {
      toast.error("Error cargando periodos", {
        description: e instanceof ContableApiError ? e.message : "",
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, year]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleLock = async (p: PeriodoContable) => {
    if (!tenantId) return;
    try {
      await lockPeriodo(tenantId, p.id);
      toast.success(p.status === "open" ? "Periodo en cierre suave" : "Periodo locked");
      void load();
    } catch (e) {
      toast.error("No se pudo cerrar el periodo", {
        description: e instanceof ContableApiError ? e.message : "",
      });
    }
  };

  return (
    <ContablePageShell
      title="Periodos contables"
      description="Control de apertura, cierre suave y lock por ejercicio fiscal."
      icon={<CalendarRange className="h-10 w-10" aria-hidden />}
    >
      <div className="mb-4 max-w-xs">
        <Select
          label="Año fiscal"
          value={String(year)}
          onChange={(e) => setYear(Number(e.target.value))}
          options={[year - 1, year, year + 1].map((y) => ({ value: String(y), label: String(y) }))}
        />
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Cargando periodos…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03] text-left text-[10px] uppercase text-zinc-500">
                <th className="px-4 py-3">Periodo</th>
                <th className="px-4 py-3">Inicio</th>
                <th className="px-4 py-3">Fin</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-white/5">
                  <td className="px-4 py-3 font-mono text-xs">{p.label}</td>
                  <td className="px-4 py-3">{p.fecha_inicio}</td>
                  <td className="px-4 py-3">{p.fecha_fin}</td>
                  <td className="px-4 py-3"><PeriodoStatusBadge status={p.status} /></td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {p.status !== "locked" ? (
                        <Button size="sm" variant="secondary" onClick={() => void handleLock(p)}>
                          <Lock className="mr-1 h-3 w-3" /> {p.status === "open" ? "Cierre suave" : "Lock"}
                        </Button>
                      ) : null}
                      {p.status === "soft_closed" ? (
                        <Button size="sm" variant="ghost" onClick={() => setReopenTarget(p)}>
                          <Unlock className="mr-1 h-3 w-3" /> Reabrir
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <JustificationModal
        open={!!reopenTarget}
        title="Reabrir periodo"
        description="Indica la justificación para reabrir un periodo en cierre suave."
        confirmLabel="Reabrir"
        loading={actionLoading}
        onClose={() => setReopenTarget(null)}
        onConfirm={async (justification) => {
          if (!tenantId || !reopenTarget) return;
          setActionLoading(true);
          try {
            await reopenPeriodo(tenantId, reopenTarget.id, { justification });
            toast.success("Periodo reabierto");
            setReopenTarget(null);
            void load();
          } catch (e) {
            toast.error("No se pudo reabrir", {
              description: e instanceof ContableApiError ? e.message : "",
            });
          } finally {
            setActionLoading(false);
          }
        }}
      />
    </ContablePageShell>
  );
}
