"use client";

import { useQuery } from "@tanstack/react-query";
import { Gauge, Landmark, LineChart } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccKpiTile } from "@/components/dcc/DccKpiTile";
import { DccPageMarco } from "@/components/dcc/DccPageMarco";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { SelloCalidad } from "@/components/dcc/SelloCalidad";
import { apiFetch } from "@/lib/api/fetch-client";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { formatEntero, formatMonedaCompacta } from "@/lib/dcc/formato";
import type { Calidad } from "@/lib/dcc/calidad";
import type { MarcaDcc } from "@/lib/dcc/marca";
import { porcentaje } from "../comun/formato";

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

const LENDERS_PATH = "/api/v2/credit/bank/kpis/lenders";
const RESUMEN_PATH = "/api/v2/credit/bank/kpis/resumen";
const MESES_TENDENCIA = 6;

/** Mes UTC "AAAA-MM", `atras` meses antes del actual (como el backend). */
function mesUtc(ahora: Date, atras: number): string {
  const d = new Date(Date.UTC(ahora.getUTCFullYear(), ahora.getUTCMonth() - atras, 1));
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Una cifra del backend `{value, ...}`: el valor, o null si falta (nunca 0). */
const valorMetrica = (m: unknown): number | null => numero(reg(m)?.value);
const etapa = (metricas: Registro | null, k: string): number | null => valorMetrica(reg(metricas?.embudo)?.[k]);
/** El backend da el porcentaje ya multiplicado por 100. */
const pct = (v: number | null, f: MarcaDcc["formato"]) => (v === null ? null : porcentaje(v / 100, f));
const horas = (v: number | null, f: MarcaDcc["formato"]) => (v === null ? null : new Intl.NumberFormat(f.locale, { maximumFractionDigits: 1 }).format(v));
const SIN_DATOS: Calidad = { estado: "no_disponible", motivo: "Sin solicitudes evaluadas en el periodo.", delBackend: true };

/**
 * Misma consulta de prestamistas que /credit/bank/kpis, con el mismo cliente
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

/**
 * KPIs de banco (bank-v2): Resumen y Tendencia salen de kpis/resumen y
 * kpis/tendencia (últimos 6 meses UTC), Por prestamista de kpis/lenders. Una
 * cifra sin valor se dice "Sin solicitudes evaluadas", nunca 0.
 */
export function KpisBancoV2({ marca }: { marca: MarcaDcc }) {
  const prestamistasQ = useKpi(LENDERS_PATH);
  const [desde, hasta] = [mesUtc(new Date(), MESES_TENDENCIA - 1), mesUtc(new Date(), 0)];
  const resumenQ = useKpi(RESUMEN_PATH);
  const tendenciaQ = useKpi(`/api/v2/credit/bank/kpis/tendencia?desde=${desde}&hasta=${hasta}`);
  const f = marca.formato;
  const rm = reg(reg(resumenQ.data)?.metricas);
  const serie = lista(tendenciaQ.data, ["serie"]).map((p) => ({ periodo: String(p.periodo ?? ""), m: reg(p.metricas) }));
  const prestamistas = lista(prestamistasQ.data, ["lenders", "items", "rows", "data", "results"]).map((r) => ({
    nombre: String(primero(r, ["lender_display_name", "lender_name", "lender_code", "lender", "name"]) ?? "Prestamista sin nombre"),
    solicitudes: numero(primero(r, ["applications", "applications_total", "total_applications", "count"])),
    aprobadas: numero(primero(r, ["approved", "approved_count", "accepted_offers", "approvals"])),
    monto: numero(primero(r, ["amount", "total_approved_amount", "approved_amount", "volume"])),
  }));

  return (
    <DccPageMarco titulo="KPIs de banco" marca={marca}>
      <div className="grid gap-[var(--dcc-gap)]">
        <div className="grid items-start gap-[var(--dcc-gap)] lg:grid-cols-2">
          <DccSeccion titulo="Resumen del mes" icono={Gauge} testId="kpis-resumen">
            {resumenQ.isError ? (
              <SelloCalidad calidad={{ estado: "no_disponible", motivo: "El resumen de solicitudes y ofertas no respondió; vuelve a intentarlo.", delBackend: true }} />
            ) : resumenQ.data === undefined ? (
              <DccEstado estado="cargando" />
            ) : (
              <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                <DccKpiTile etiqueta="Solicitudes recibidas" valor={formatEntero(etapa(rm, "recibidas"), f)} calidad={etapa(rm, "recibidas") === null ? SIN_DATOS : null} />
                <DccKpiTile etiqueta="Ofertadas" valor={formatEntero(etapa(rm, "ofertadas"), f)} calidad={etapa(rm, "ofertadas") === null ? SIN_DATOS : null} />
                <DccKpiTile etiqueta="Tasa de aprobación" valor={pct(valorMetrica(rm?.tasa_aprobacion), f)} calidad={valorMetrica(rm?.tasa_aprobacion) === null ? SIN_DATOS : null} />
                <DccKpiTile etiqueta="Tasa de desembolso" valor={pct(valorMetrica(rm?.tasa_desembolso), f)} calidad={valorMetrica(rm?.tasa_desembolso) === null ? SIN_DATOS : null} />
                <DccKpiTile etiqueta="Respuesta media" valor={horas(valorMetrica(rm?.tiempo_medio_respuesta), f)} unidad="h" calidad={valorMetrica(rm?.tiempo_medio_respuesta) === null ? SIN_DATOS : null} />
              </div>
            )}
          </DccSeccion>
          <DccSeccion titulo="Tendencia" icono={LineChart} testId="kpis-tendencia">
            {tendenciaQ.isError ? (
              <SelloCalidad calidad={{ estado: "no_disponible", motivo: "La tendencia de solicitudes y aprobaciones no respondió; vuelve a intentarlo.", delBackend: true }} />
            ) : tendenciaQ.data === undefined ? (
              <DccEstado estado="cargando" />
            ) : serie.length === 0 ? (
              <DccEstado estado="vacio" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className={`text-left text-[11px] uppercase tracking-[0.06em] ${DCC_CLASSES.subtle}`}>
                    <th className="pb-2 pr-3 font-semibold">Mes</th>
                    <th className="pb-2 pr-3 text-right font-semibold">Recibidas</th>
                    <th className="pb-2 pr-3 text-right font-semibold">Aprobación</th>
                    <th className="pb-2 text-right font-semibold">Desembolso</th>
                  </tr>
                </thead>
                <tbody>
                  {serie.map((p) => (
                    <tr key={p.periodo} className="border-t border-[var(--dcc-border)]">
                      <td className="py-2 pr-3">{p.periodo}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{formatEntero(etapa(p.m, "recibidas"), f) ?? "—"}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{pct(valorMetrica(p.m?.tasa_aprobacion), f) ?? "—"}</td>
                      <td className="py-2 text-right tabular-nums">{pct(valorMetrica(p.m?.tasa_desembolso), f) ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </DccSeccion>
        </div>
        <DccSeccion titulo="Por prestamista" icono={Landmark}>
          {prestamistasQ.isError ? (
            <DccEstado estado="no_disponible" detalle="Esta información estará disponible próximamente." />
          ) : prestamistasQ.data === undefined ? (
            <DccEstado estado="cargando" />
          ) : prestamistas.length === 0 ? (
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
          )}
        </DccSeccion>
      </div>
    </DccPageMarco>
  );
}
