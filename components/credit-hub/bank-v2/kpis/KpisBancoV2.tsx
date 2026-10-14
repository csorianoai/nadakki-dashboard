"use client";

import { useQuery } from "@tanstack/react-query";
import { Gauge, Landmark, LineChart } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccPageMarco } from "@/components/dcc/DccPageMarco";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { SelloCalidad } from "@/components/dcc/SelloCalidad";
import { apiFetch } from "@/lib/api/fetch-client";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { formatEntero, formatMonedaCompacta } from "@/lib/dcc/formato";
import type { MarcaDcc } from "@/lib/dcc/marca";
import { DetalleTecnico } from "../comun/DetalleTecnico";
import { proximamente, type NotaTecnica } from "../comun/llano";

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
 * KPIs de banco (bank-v2). Solo "Por prestamista" tiene hoy una fuente que
 * responde. Resumen y Tendencia se muestran como "Próximamente", sin consulta
 * y sin aviso de error:
 *  - Resumen: la pantalla actual pide `/credit/dashboard/summary`, ruta que no
 *    pasa por el BFF (`/api/v2/...`) y cae en una pagina de Next, no en el
 *    backend. Pedirla solo producia un "el backend no respondió" falso.
 *  - Tendencia: kpis/trends responde `available: false` (y ademas suma ofertas
 *    aceptadas como si fueran desembolsos).
 * El porque va al bloque plegado "Detalle técnico".
 */
export function KpisBancoV2({ marca }: { marca: MarcaDcc }) {
  const prestamistasQ = useKpi(LENDERS_PATH);
  const f = marca.formato;
  const prestamistas = lista(prestamistasQ.data, ["lenders", "items", "rows", "data", "results"]).map((r) => ({
    nombre: String(primero(r, ["lender_display_name", "lender_name", "lender_code", "lender", "name"]) ?? "Prestamista sin nombre"),
    solicitudes: numero(primero(r, ["applications", "applications_total", "total_applications", "count"])),
    aprobadas: numero(primero(r, ["approved", "approved_count", "accepted_offers", "approvals"])),
    monto: numero(primero(r, ["amount", "total_approved_amount", "approved_amount", "volume"])),
  }));
  const notas: NotaTecnica[] = [
    { que: "Resumen", detalle: "/credit/dashboard/summary no pasa por el BFF (/api/v2): no hay endpoint de resumen del banco" },
    { que: "Tendencia", detalle: "kpis/trends devuelve available: false; además suma ofertas aceptadas, no solo desembolsos" },
  ];
  if (prestamistasQ.isError) notas.push({ que: "Por prestamista", detalle: "kpis/lenders no respondió o devolvió available: false" });

  return (
    <DccPageMarco titulo="KPIs de banco" marca={marca}>
      <div className="grid gap-[var(--dcc-gap)]">
        <div className="grid items-start gap-[var(--dcc-gap)] lg:grid-cols-2">
          <DccSeccion titulo="Resumen" icono={Gauge} testId="kpis-resumen">
            <SelloCalidad calidad={proximamente("El resumen de solicitudes y ofertas estará disponible próximamente.")} />
          </DccSeccion>
          <DccSeccion titulo="Tendencia" icono={LineChart} testId="kpis-tendencia">
            <SelloCalidad calidad={proximamente("La tendencia de solicitudes y aprobaciones estará disponible próximamente.")} />
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
        <DetalleTecnico notas={notas} />
      </div>
    </DccPageMarco>
  );
}
