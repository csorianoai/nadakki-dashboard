"use client";

import { useCallback, useState } from "react";
import { PieChart as PieChartIcon, Loader2, ChevronDown, ChevronRight, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { Button, Input } from "@/components/forge";
import { ContableApiError, getSituacionFinanciera } from "@/app/hooks/contable";
import { ContablePageShell } from "@/components/contable/ContablePageShell";
import { useContableTenantId } from "@/components/contable/useContableTenantId";
import type { SituacionFinancieraReport, SituacionFinancieraDetalle } from "@/types/contable";
import { cn } from "@/lib/utils";
import {
  MonedaFuncionalNota,
  formateaImporteContable,
  useMonedaFuncional,
} from "@/components/contable/monedaFuncional";

const COLORS = {
  activo: "#10b981",
  pasivo: "#f59e0b",
  patrimonio: "#6366f1",
};


function ExpandableSection({
  title,
  total,
  detalle,
  colorClass,
  importe,
}: {
  title: string;
  total: number;
  detalle: SituacionFinancieraDetalle[] | { codigo: string; nombre: string; saldo: number }[];
  colorClass: string;
  /**
   * Formateador de la pantalla. Baja como prop en vez de llamar al hook aqui para
   * que este bloque siga siendo puro: la moneda la decide el cliente, una sola vez.
   */
  importe: (valor: number | null | undefined) => string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.02]">
      <button
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {open ? <ChevronDown className="h-4 w-4 text-zinc-400" /> : <ChevronRight className="h-4 w-4 text-zinc-400" />}
          <span className={cn("text-sm font-bold", colorClass)}>{title}</span>
        </div>
        <span className={cn("font-mono text-sm font-bold", colorClass)}>{importe(total)}</span>
      </button>
      {open && detalle.length > 0 && (
        <div className="border-t border-white/5 px-4 py-2">
          <table className="min-w-full text-sm">
            <tbody>
              {detalle.map((d) => (
                <tr key={d.codigo} className="border-b border-white/5">
                  <td className="py-1.5 font-mono text-xs text-zinc-400">{d.codigo}</td>
                  <td className="py-1.5 pl-3">{d.nombre}</td>
                  <td className="py-1.5 text-right font-mono">{importe(d.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function SituacionFinancieraClient() {
  const moneda = useMonedaFuncional();
  /** Importe en la moneda funcional del tenant. Sin moneda, em dash: nunca una inventada. */
  const importe = (valor: number | null | undefined) => formateaImporteContable(valor, moneda);
  const tenantId = useContableTenantId();
  const [fecha, setFecha] = useState(() => new Date().toISOString().slice(0, 10));
  const [report, setReport] = useState<SituacionFinancieraReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async () => {
    if (!tenantId) return;
    setLoading(true);
    setError(null);
    try {
      setReport(await getSituacionFinanciera(tenantId, fecha));
    } catch (e) {
      if (e instanceof ContableApiError && (e.status === 404 || e.status === 400)) {
        setReport(null);
        setError(null);
      } else {
        const msg = e instanceof ContableApiError ? e.message : "Error generando reporte";
        setError(msg);
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId, fecha]);

  const stackedData = report
    ? [
        {
          name: "Activos",
          Corriente: report?.activos?.corriente ?? 0,
          "No corriente": report?.activos?.no_corriente ?? 0,
        },
        {
          name: "Pasivos",
          Corriente: report?.pasivos?.corriente ?? 0,
          "No corriente": report?.pasivos?.no_corriente ?? 0,
        },
      ]
    : [];

  return (
    <ContablePageShell
      title="Situación Financiera"
      description="Balance general: activos, pasivos y patrimonio a una fecha determinada."
      icon={<PieChartIcon className="h-10 w-10" aria-hidden />}
    >
      <MonedaFuncionalNota locale={moneda} />

      <div className="mb-6 flex flex-wrap items-end gap-3">
        <Input label="Fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        <Button onClick={() => void generate()} disabled={loading}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Generar
        </Button>
      </div>

      {error && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-200">
          {error}
        </div>
      )}

      {!report && !loading && !error && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <p className="text-zinc-400 text-sm">No hay datos disponibles para esta fecha.</p>
          <p className="text-zinc-500 text-xs mt-1">Crea períodos y asientos para ver la situación financiera.</p>
        </div>
      )}

      {report && (
        <div className="space-y-6">
          {/* Ecuación contable */}
          <div
            className={cn(
              "flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold",
              report.ecuacion_cuadra
                ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                : "border-rose-500/30 bg-rose-500/10 text-rose-200",
            )}
          >
            {report.ecuacion_cuadra ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Ecuación contable {report?.ecuacion_cuadra ? "CUADRA" : "NO CUADRA"}: Activos ({importe(report?.activos?.total ?? 0)}) = Pasivos ({importe(report?.pasivos?.total ?? 0)}) + Patrimonio ({importe(report?.patrimonio?.total ?? 0)})
          </div>

          {/* 3 KPI cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400/80">Total Activos</p>
              <p className="mt-1 font-mono text-2xl font-bold text-emerald-100">{importe(report?.activos?.total ?? 0)}</p>
            </div>
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400/80">Total Pasivos</p>
              <p className="mt-1 font-mono text-2xl font-bold text-amber-100">{importe(report?.pasivos?.total ?? 0)}</p>
            </div>
            <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-indigo-400/80">Total Patrimonio</p>
              <p className="mt-1 font-mono text-2xl font-bold text-indigo-100">{importe(report?.patrimonio?.total ?? 0)}</p>
            </div>
          </div>

          {/* Stacked bar chart */}
          {stackedData.length > 0 && (
            <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
              <h3 className="mb-3 text-sm font-bold text-white">Composición corriente vs no corriente</h3>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stackedData}>
                  <XAxis dataKey="name" stroke="#71717a" fontSize={12} />
                  <YAxis stroke="#71717a" fontSize={11} tickFormatter={(v: number) => `${(v / 1000).toFixed(0)}k`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#18181b", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, color: "#fff" }}
                    formatter={(value: number) => [importe(value), ""]}
                  />
                  <Legend wrapperStyle={{ color: "#a1a1aa", fontSize: 11 }} />
                  <Bar dataKey="Corriente" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="No corriente" stackId="a" fill="#065f46" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Expandable sections */}
          <ExpandableSection
            importe={importe}
            title="Activos"
            total={report?.activos?.total ?? 0}
            detalle={report?.activos?.detalle ?? []}
            colorClass="text-emerald-200"
          />
          <ExpandableSection
            importe={importe}
            title="Pasivos"
            total={report?.pasivos?.total ?? 0}
            detalle={report?.pasivos?.detalle ?? []}
            colorClass="text-amber-200"
          />
          <ExpandableSection
            importe={importe}
            title="Patrimonio"
            total={report?.patrimonio?.total ?? 0}
            detalle={report?.patrimonio?.detalle ?? []}
            colorClass="text-indigo-200"
          />
        </div>
      )}
    </ContablePageShell>
  );
}
