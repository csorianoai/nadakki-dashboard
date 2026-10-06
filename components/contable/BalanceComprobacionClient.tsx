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
import { ErrorConReintentar } from "@/components/contable/ErrorConReintentar";
import { useContableTenantId } from "@/components/contable/useContableTenantId";
import {
  MonedaFuncionalNota,
  formateaImporteContable,
  useMonedaFuncional,
} from "@/components/contable/monedaFuncional";
import type { BalanceComprobacionReport, PeriodoContable } from "@/types/contable";
import { cn } from "@/lib/utils";
import { evaluaCuadre } from "@/lib/contable/cuadre";
import { opcionPeriodo } from "@/lib/contable/periodo-nombre";

export function BalanceComprobacionClient() {
  const tenantId = useContableTenantId();
  const moneda = useMonedaFuncional();
  const importe = (valor: number | null | undefined) => formateaImporteContable(valor, moneda);
  const [periodos, setPeriodos] = useState<PeriodoContable[]>([]);
  const [periodoId, setPeriodoId] = useState("");
  const [report, setReport] = useState<BalanceComprobacionReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorPeriodos, setErrorPeriodos] = useState<string | null>(null);
  const [intentoPeriodos, setIntentoPeriodos] = useState(0);

  // Igual que en Libro mayor: sin `.catch` un fallo de `/periodos` dejaba el
  // selector vacio y la pantalla sin nada que decir.
  useEffect(() => {
    if (!tenantId) return;
    let cancelado = false;
    setErrorPeriodos(null);
    void listPeriodos(tenantId, new Date().getFullYear())
      .then((p) => {
        if (cancelado) return;
        setPeriodos(p);
        if (p[0]) setPeriodoId(p[0].id);
      })
      .catch((e) => {
        if (cancelado) return;
        setErrorPeriodos(e instanceof ContableApiError ? e.message : "");
      });
    return () => {
      cancelado = true;
    };
  }, [tenantId, intentoPeriodos]);

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

  // El veredicto sale de los totales (en centavos), no del flag: debe = haber = 0 cuadra.
  const cuadra = evaluaCuadre(report?.totals?.total_debe ?? 0, report?.totals?.total_haber ?? 0) === true;

  return (
    <ContablePageShell
      title="Balance de comprobación"
      description="Sumas de debe y haber por cuenta — totales globales deben cuadrar."
      icon={<Scale className="h-10 w-10" aria-hidden />}
    >
      {errorPeriodos !== null ? (
        <ErrorConReintentar
          titulo="No se pudieron cargar los periodos."
          detalle={errorPeriodos || undefined}
          onReintentar={() => setIntentoPeriodos((n) => n + 1)}
        />
      ) : null}

      <div className="mb-4 max-w-xs">
        <Select
          label="Periodo"
          value={periodoId}
          onChange={(e) => setPeriodoId(e.target.value)}
          options={periodos.map((p) => ({ value: p.id, label: opcionPeriodo(p) }))}
        />
      </div>

      <MonedaFuncionalNota locale={moneda} />

      {loading ? (
        <p className="text-sm text-zinc-500">Calculando balance…</p>
      ) : report ? (
        <div className="space-y-4">
          {cuadra ? (
            <p data-testid="balance-veredicto" className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200">
              Totales globales CUADRAN
            </p>
          ) : (
            <p data-testid="balance-veredicto" className="rounded-lg border border-rose-500/30 bg-rose-500/10 px-4 py-2 text-sm font-semibold text-rose-200">
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
                {report?.rows?.map((r) => (
                  <tr key={r.cuenta_id} className="border-b border-white/5">
                    <td className="px-4 py-2 font-mono text-xs">{r.codigo}</td>
                    <td className="px-4 py-2">{r.nombre}</td>
                    <td className="px-4 py-2 text-right font-mono">{importe(r.total_debe)}</td>
                    <td className="px-4 py-2 text-right font-mono">{importe(r.total_haber)}</td>
                    <td className="px-4 py-2 text-right font-mono">{importe(r.saldo)}</td>
                  </tr>
                ))}
                <tr className={cn("bg-white/[0.04] font-bold", cuadra ? "text-emerald-200" : "text-rose-200")}>
                  <td className="px-4 py-3" colSpan={2}>TOTALES</td>
                  <td className="px-4 py-3 text-right font-mono">{importe(report?.totals?.total_debe ?? 0)}</td>
                  <td className="px-4 py-3 text-right font-mono">{importe(report?.totals?.total_haber ?? 0)}</td>
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
