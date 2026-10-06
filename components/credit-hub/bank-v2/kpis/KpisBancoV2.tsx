"use client";

import { useQuery } from "@tanstack/react-query";
import { Gauge, Landmark, LineChart } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccKpiTile } from "@/components/dcc/DccKpiTile";
import { DccPageMarco } from "@/components/dcc/DccPageMarco";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { apiFetch } from "@/lib/api/fetch-client";
import { STATE_LABEL } from "@/lib/credit-hub/bank/bankFormat";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import type { Calidad } from "@/lib/dcc/calidad";
import { formatEntero, formatMonedaCompacta } from "@/lib/dcc/formato";
import type { MarcaDcc } from "@/lib/dcc/marca";

const SIN_SELLO: Calidad = { estado: "parcial", cubiertos: null, total: null, motivo: "El backend del banco aún no declara la calidad de esta cifra" };
type Registro = Record<string, unknown>;
const reg = (v: unknown): Registro | null => (v && typeof v === "object" && !Array.isArray(v) ? (v as Registro) : null);
const numero = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : typeof v === "string" && v.trim() ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};
const lista = (body: unknown, claves: string[]): Registro[] => {
  const r = reg(body);
  const arr = r ? claves.map((k) => r[k]).find(Array.isArray) : Array.isArray(body) ? body : null;
  return ((arr as unknown[] | null) ?? []).map((x) => reg(x) ?? {});
};
const primero = (r: Registro, claves: string[]) => claves.map((k) => r[k]).find((v) => v != null);

/**
 * Las mismas tres consultas que /credit/bank/kpis, con el mismo cliente
 * (apiFetch) y la misma cabecera de tenant. Un sobre `available: false` o un
 * error se dicen en llano; nada ausente se convierte en 0.
 */
async function leer(path: string, tenantId: string): Promise<unknown> {
  const res = await apiFetch(path, { method: "GET", headers: { Accept: "application/json", "X-Tenant-ID": tenantId }, cache: "no-store" });
  const texto = await res.text();
  const body = texto ? (JSON.parse(texto) as unknown) : null;
  if (!res.ok || reg(body)?.available === false) throw new Error("no_disponible");
  return body;
}

function useKpi(path: string) {
  const { apiTenantId } = useTenant();
  return useQuery({ queryKey: ["bank-v2", "kpi", path, apiTenantId], queryFn: () => leer(path, apiTenantId!), enabled: !!apiTenantId, retry: false });
}

export function KpisBancoV2({ marca }: { marca: MarcaDcc }) {
  const resumenQ = useKpi("/credit/dashboard/summary");
  const prestamistasQ = useKpi("/api/v2/credit/bank/kpis/lenders");
  const tendenciaQ = useKpi("/api/v2/credit/bank/kpis/trends");
  const f = marca.formato;
  const resumen = reg(reg(resumenQ.data)?.summary);
  const porEstado = Object.entries(reg(resumen?.applications_by_status) ?? {})
    .map(([k, v]) => [STATE_LABEL[k]?.[0] ?? STATE_LABEL[k.toLowerCase()]?.[0] ?? null, numero(v)] as const)
    .filter((x): x is readonly [string, number] => x[0] !== null && x[1] !== null);
  const prestamistas = lista(prestamistasQ.data, ["lenders", "items", "rows", "data", "results"]).map((r) => ({
    nombre: String(primero(r, ["lender_display_name", "lender_name", "lender_code", "lender", "name"]) ?? "Prestamista sin nombre"),
    solicitudes: numero(primero(r, ["applications", "applications_total", "total_applications", "count"])),
    aprobadas: numero(primero(r, ["approved", "approved_count", "accepted_offers", "approvals"])),
    monto: numero(primero(r, ["amount", "total_approved_amount", "approved_amount", "volume"])),
  }));
  const tendencia = lista(tendenciaQ.data, ["points", "trends", "series", "items", "data", "buckets"]).map((r) => ({
    periodo: String(primero(r, ["period", "date", "month", "day", "label", "bucket"]) ?? ""),
    solicitudes: numero(primero(r, ["applications", "applications_total", "count", "total"])),
    aprobadas: numero(primero(r, ["approved", "approved_count", "approvals"])),
  }));
  const maxTendencia = Math.max(0, ...tendencia.map((t) => t.solicitudes ?? 0));
  const estado = (q: { isError: boolean; data: unknown }, que: string) =>
    q.isError ? <DccEstado estado="no_disponible" detalle={`${que}: el backend no respondió o devolvió available: false`} /> : q.data === undefined ? <DccEstado estado="cargando" /> : null;

  return (
    <DccPageMarco titulo="KPIs de banco" marca={marca}>
      <div className="grid gap-[var(--dcc-gap)]">
        <DccSeccion titulo="Resumen" icono={Gauge}>
          {estado(resumenQ, "dashboard/summary") ?? (
            <div className="grid gap-4">
              <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3">
                {(
                  [
                    ["Solicitudes", "applications_total"],
                    ["Ofertas", "offers_total"],
                    ["Fallos en 24 h", "recent_failures_24h"],
                  ] as const
                ).map(([etiqueta, campo]) => {
                  const valor = formatEntero(numero(resumen?.[campo]), f);
                  return (
                    <DccKpiTile
                      key={campo}
                      etiqueta={etiqueta}
                      valor={valor}
                      calidad={valor ? SIN_SELLO : { estado: "no_disponible", motivo: `dashboard/summary no trae ${campo}` }}
                    />
                  );
                })}
              </div>
              {porEstado.length ? (
                <p className={`text-sm ${DCC_CLASSES.muted}`}>{porEstado.map(([k, v]) => `${k}: ${formatEntero(v, f)}`).join(" · ")}</p>
              ) : null}
            </div>
          )}
        </DccSeccion>
        <div className="grid items-start gap-[var(--dcc-gap)] lg:grid-cols-2">
          <DccSeccion titulo="Por prestamista" icono={Landmark}>
            {estado(prestamistasQ, "kpis/lenders") ??
              (prestamistas.length === 0 ? (
                <DccEstado estado="vacio" />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`text-left text-[11px] uppercase tracking-[0.06em] ${DCC_CLASSES.subtle}`}>
                      <th className="pb-2 pr-3 font-semibold">Prestamista</th>
                      <th className="pb-2 pr-3 text-right font-semibold">Solic.</th>
                      <th className="pb-2 pr-3 text-right font-semibold">Aprob.</th>
                      <th className="pb-2 text-right font-semibold">Monto aprobado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {prestamistas.map((p) => (
                      <tr key={p.nombre} className="border-t border-[var(--dcc-border)]">
                        <td className="py-2 pr-3">{p.nombre}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{formatEntero(p.solicitudes, f) ?? "—"}</td>
                        <td className="py-2 pr-3 text-right tabular-nums">{formatEntero(p.aprobadas, f) ?? "—"}</td>
                        <td className="py-2 text-right tabular-nums">{formatMonedaCompacta(p.monto, f) ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ))}
          </DccSeccion>
          <DccSeccion titulo="Tendencia" icono={LineChart} meta="solicitudes y aprobadas por periodo">
            {estado(tendenciaQ, "kpis/trends") ??
              (tendencia.length === 0 ? (
                <DccEstado estado="vacio" />
              ) : (
                <dl className="grid gap-2 text-sm">
                  {tendencia.map((t) => (
                    <div key={t.periodo} className="grid grid-cols-[96px_minmax(0,1fr)_88px] items-center gap-3">
                      <dt className={DCC_CLASSES.muted}>{t.periodo}</dt>
                      <span className="h-2 overflow-hidden rounded-sm bg-[var(--dcc-surface-muted)]">
                        <span className="block h-full rounded-sm bg-[var(--dcc-teal)]" style={{ width: `${maxTendencia ? ((t.solicitudes ?? 0) / maxTendencia) * 100 : 0}%` }} />
                      </span>
                      <dd className="text-right tabular-nums">
                        {formatEntero(t.solicitudes, f) ?? "—"} · {formatEntero(t.aprobadas, f) ?? "—"}
                      </dd>
                    </div>
                  ))}
                </dl>
              ))}
          </DccSeccion>
        </div>
      </div>
    </DccPageMarco>
  );
}
