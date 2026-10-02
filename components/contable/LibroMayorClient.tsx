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
} from "@/app/hooks/contable";
import { ContablePageShell } from "@/components/contable/ContablePageShell";
import { useContableTenantId } from "@/components/contable/useContableTenantId";
import {
  MonedaFuncionalNota,
  formateaImporteContable,
  useMonedaFuncional,
} from "@/components/contable/monedaFuncional";
import type { CuentaContable, LibroMayorReport, PeriodoContable } from "@/types/contable";

export function LibroMayorClient() {
  const tenantId = useContableTenantId();
  const moneda = useMonedaFuncional();
  const importe = (valor: number | null | undefined) => formateaImporteContable(valor, moneda);
  const [cuentas, setCuentas] = useState<CuentaContable[]>([]);
  const [periodos, setPeriodos] = useState<PeriodoContable[]>([]);
  const [cuentaId, setCuentaId] = useState("");
  const [periodoId, setPeriodoId] = useState("");
  const [report, setReport] = useState<LibroMayorReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tenantId) return;
    void Promise.all([
      listCuentas(tenantId, { activa: true }),
      listPeriodos(tenantId, new Date().getFullYear()),
    ]).then(([c, p]) => {
      setCuentas(c);
      setPeriodos(p);
      if (c[0]) setCuentaId(c[0].id);
      if (p[0]) setPeriodoId(p[0].id);
    });
  }, [tenantId]);

  const load = useCallback(async () => {
    if (!tenantId || !cuentaId || !periodoId) return;
    setLoading(true);
    try {
      setReport(await getLibroMayor(tenantId, cuentaId, periodoId));
    } catch (e) {
      toast.error("Error cargando libro mayor", {
        description: e instanceof ContableApiError ? e.message : "",
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, cuentaId, periodoId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <ContablePageShell
      title="Libro mayor"
      description="Movimientos y saldo acumulado por cuenta y periodo."
      icon={<BookMarked className="h-10 w-10" aria-hidden />}
    >
      <MonedaFuncionalNota locale={moneda} />

      <div className="mb-4 grid gap-3 md:grid-cols-2">
        <Select
          label="Cuenta"
          value={cuentaId}
          onChange={(e) => setCuentaId(e.target.value)}
          options={cuentas.map((c) => ({ value: c.id, label: `${c.codigo} · ${c.nombre}` }))}
        />
        <Select
          label="Periodo"
          value={periodoId}
          onChange={(e) => setPeriodoId(e.target.value)}
          options={periodos.map((p) => ({ value: p.id, label: p.label }))}
        />
      </div>

      {report ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 text-sm">
            <p className="font-mono text-emerald-200">{report.cuenta_codigo} · {report.cuenta_nombre}</p>
            <p className="mt-1 text-zinc-400">
              Saldo final:{" "}
              <span className="font-mono font-semibold text-white">
                {importe(report?.saldo_final ?? 0)}
              </span>
            </p>
          </div>

          {loading ? (
            <p className="text-sm text-zinc-500">Actualizando…</p>
          ) : (report?.movimientos?.length ?? 0) === 0 ? (
            <p className="text-sm text-zinc-500">Sin movimientos posteados en este periodo.</p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 bg-white/[0.03] text-left text-[10px] uppercase text-zinc-500">
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3">Asiento</th>
                    <th className="px-4 py-3">Descripción</th>
                    <th className="px-4 py-3 text-right">Debe</th>
                    <th className="px-4 py-3 text-right">Haber</th>
                    <th className="px-4 py-3 text-right">Saldo</th>
                  </tr>
                </thead>
                <tbody>
                  {report?.movimientos?.map((m) => (
                    <tr key={m.id} className="border-b border-white/5">
                      <td className="px-4 py-2">{m.fecha}</td>
                      <td className="px-4 py-2 font-mono text-xs">{m.numero_asiento ?? m.asiento_id.slice(0, 8)}</td>
                      <td className="px-4 py-2">{m.descripcion}</td>
                      <td className="px-4 py-2 text-right font-mono">{m.debe_base ? importe(m.debe_base) : "—"}</td>
                      <td className="px-4 py-2 text-right font-mono">{m.haber_base ? importe(m.haber_base) : "—"}</td>
                      <td className="px-4 py-2 text-right font-mono text-emerald-200">{importe(m.saldo_acumulado)}</td>
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
