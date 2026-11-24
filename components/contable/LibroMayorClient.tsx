"use client";

import { useCallback, useEffect, useState } from "react";
import { BookMarked } from "lucide-react";
import { toast } from "sonner";
import { Select } from "@/components/forge";
import {
  ContableApiError,
  getLibroMayor,
  listCuentas,
  listPeriodos,
  fechaLocalIso,
  periodoQueContieneFecha,
  type MayorCuentaRow,
} from "@/app/hooks/contable";
import { ContablePageShell } from "@/components/contable/ContablePageShell";
import { ErrorConReintentar } from "@/components/contable/ErrorConReintentar";
import { useContableTenantId } from "@/components/contable/useContableTenantId";
import {
  MonedaFuncionalNota,
  formateaImporteContable,
  useMonedaFuncional,
} from "@/components/contable/monedaFuncional";
import type { CuentaContable, PeriodoContable } from "@/types/contable";

export function LibroMayorClient() {
  const tenantId = useContableTenantId();
  const moneda = useMonedaFuncional();
  const importe = (valor: number | null | undefined) => formateaImporteContable(valor, moneda);
  const [cuentas, setCuentas] = useState<CuentaContable[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoContable[]>([]);
  const [cuentaId, setCuentaId] = useState("");
  const [periodoId, setPeriodoId] = useState("");
  const [report, setReport] = useState<MayorCuentaRow[] | null>(null);
  const [catalogoListo, setCatalogoListo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorCatalogo, setErrorCatalogo] = useState<string | null>(null);
  const [intentoCatalogo, setIntentoCatalogo] = useState(0);

  // Cuentas y periodos. Un fallo aqui se dice en pantalla con "Reintentar": sin
  // el `.catch` la promesa quedaba rechazada sin manejar y los dos selectores
  // se quedaban vacios y mudos.
  useEffect(() => {
    if (!tenantId) return;
    let cancelado = false;
    setErrorCatalogo(null);
    void Promise.all([
      listCuentas(tenantId, { activa: true }),
      listPeriodos(tenantId, new Date().getFullYear()),
    ])
      .then(([c, p]) => {
        if (cancelado) return;
        setCuentas(c);
        setPeriodos(p);
        setPeriodoId(periodoQueContieneFecha(p, fechaLocalIso())?.id ?? "");
        setCatalogoListo(true);
      })
      .catch((e) => {
        if (cancelado) return;
        setErrorCatalogo(e instanceof ContableApiError ? e.message : "");
      });
    return () => {
      cancelado = true;
    };
  }, [tenantId, intentoCatalogo]);

  const load = useCallback(async () => {
    if (!tenantId || !catalogoListo) return;
    setLoading(true);
    try {
      setReport(await getLibroMayor(tenantId, cuentaId || undefined, periodoId || undefined));
    } catch (e) {
      toast.error("Error cargando libro mayor", {
        description: e instanceof ContableApiError ? e.message : "",
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, cuentaId, periodoId, catalogoListo]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ContablePageShell
      title="Libro mayor"
      description="Saldos por cuenta del período seleccionado o de todos los períodos."
      icon={<BookMarked className="h-10 w-10" aria-hidden />}
    >
      <MonedaFuncionalNota locale={moneda} />

      {errorCatalogo !== null ? (
        <ErrorConReintentar
          titulo="No se pudieron cargar las cuentas y los periodos."
          detalle={errorCatalogo || undefined}
          onReintentar={() => setIntentoCatalogo((n) => n + 1)}
        />
      ) : null}

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <Select
          label="Cuenta"
          value={cuentaId}
          onChange={(e) => setCuentaId(e.target.value)}
          options={[{ value: "", label: "Todas las cuentas" }, ...cuentas.map((c) => ({ value: c.id, label: `${c.codigo} · ${c.nombre}` }))]}
        />
        <Select
          label="Periodo"
          value={periodoId}
          onChange={(e) => setPeriodoId(e.target.value)}
          options={[{ value: "", label: "Todos los períodos" }, ...periodos.map((p) => ({ value: p.id, label: p.label }))]}
        />
      </div>

      {report ? (
        <div className="space-y-4">
          {loading ? (
            <p className="text-sm text-zinc-400">Actualizando…</p>
          ) : report.length === 0 ? (
            <p className="text-sm text-zinc-400">Sin saldos posteados en este período.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03] text-left text-[10px] uppercase text-zinc-400">
                    <th className="px-4 py-3">Período</th>
                    <th className="px-4 py-3">Código</th>
                    <th className="px-4 py-3">Cuenta</th>
                    <th className="px-4 py-3 text-right">Debe</th>
                    <th className="px-4 py-3 text-right">Haber</th>
                    <th className="px-4 py-3 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {report.map((row) => (
                    <tr key={`${row.periodo_id}:${row.cuenta_id}`} className="border-b border-white/5">
                      <td className="px-4 py-2">{periodos.find((p) => p.id === row.periodo_id)?.label ?? row.periodo_id}</td>
                      <td className="px-4 py-2 font-mono text-xs">{row.codigo}</td>
                      <td className="px-4 py-2">{row.nombre}</td>
                      <td className="px-4 py-2 text-right font-mono">{importe(row.total_debe)}</td>
                      <td className="px-4 py-2 text-right font-mono">{importe(row.total_haber)}</td>
                      <td className="px-4 py-2 text-right font-mono text-emerald-200">{importe(row.saldo)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </ContablePageShell>
  );
}
