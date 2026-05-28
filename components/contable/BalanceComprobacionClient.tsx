"use client";

import { useCallback, useEffect, useState } from "react";
import { Scale } from "lucide-react";
import { toast } from "sonner";
import { Select } from "@/components/forge";
import {
  ContableApiError,
  getBalanceComprobacion,
  listPeriodos,
} from "@/app/hooks/contable";
import { ContablePageShell } from "@/components/contable/ContablePageShell";
import { useContableTenantId } from "@/components/contable/useContableTenantId";
import type { BalanceComprobacionReport, PeriodoContable } from "@/types/contable";
import { cn } from "@/lib/utils";

export function BalanceComprobacionClient() {
  const tenantId = useContableTenantId();
  const [periodos, setPeriodos] = useState<PeriodoContable[]>([]);
  const [periodoId, setPeriodoId] = useState("");
  const [report, setReport] = useState<BalanceComprobacionReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    void listPeriodos(tenantId, new Date().getFullYear()).then((p) => {
      setPeriodos(p);
      if (p[0]) setPeriodoId(p[0].id);
    });
  }, [tenantId]);

  const load = useCallback(async () => {
    if (!tenantId || !periodoId) return;
    setLoading(true);
    try {
      setReport(await getBalanceComprobacion(tenantId, periodoId));
    } catch (e) {
      toast.error("Error cargando balance", {
        description: e instanceof ContableApiError ? e.message : "",
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, periodoId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ContablePageShell
      title="Balance de comprobación"
      description="Sumas de debe y haber por cuenta — totales globales deben cuadrar."
      icon={<Scale className="h-10 w-10" aria-hidden />}
    >
      <div className="mb-4 max-w-xs">
        <Select
          label="Periodo"
          value={periodoId}
          onChange={(e) => setPeriodoId(e.target.value)}
          options={periodos.map((p) => ({ value: p.id, label: `${p.label} (${p.status})` }))}
        />
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Calculando balance…</p>
      ) : report ? (
        <div className="space-y-4">
          {report.totals.cuadra ? (
            <p className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
              Totales globales CUADRAN
            </p>
          ) : (
            <p className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200">
              Totales globales NO cuadran — revisar asientos posteados
            </p>
          )}

          <div className="overflow-x-auto rounded-xl border border-white/10">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.03] text-left text-[10px] uppercase text-zinc-500">
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Cuenta</th>
                  <th className="px-4 py-3 text-right">Debe</th>
                  <th className="px-4 py-3 text-right">Haber</th>
                  <th className="px-4 py-3 text-right">Saldo</th>
                </tr>
              </thead>
              <tbody>
                {report.rows.map((r) => (
                  <tr key={r.cuenta_id} className="border-b border-white/5">
                    <td className="px-4 py-2 font-mono text-xs">{r.codigo}</td>
                    <td className="px-4 py-2">{r.nombre}</td>
                    <td className="px-4 py-2 text-right font-mono">{r.total_debe.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-mono">{r.total_haber.toFixed(2)}</td>
                    <td className="px-4 py-2 text-right font-mono">{r.saldo.toFixed(2)}</td>
                  </tr>
                ))}
                <tr className={cn("bg-white/[0.04] font-bold", report.totals.cuadra ? "text-emerald-200" : "text-rose-200")}>
                  <td className="px-4 py-3" colSpan={2}>TOTALES</td>
                  <td className="px-4 py-3 text-right font-mono">{report.totals.total_debe.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono">{report.totals.total_haber.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono">—</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </ContablePageShell>
  );
}
