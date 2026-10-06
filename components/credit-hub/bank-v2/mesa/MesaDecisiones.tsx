"use client";

import Link from "next/link";
import { BarChart3, CalendarClock, Gauge, HeartPulse, Inbox, Network, Sparkles } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccKpiTile } from "@/components/dcc/DccKpiTile";
import { DccPageMarco } from "@/components/dcc/DccPageMarco";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { SelloCalidad } from "@/components/dcc/SelloCalidad";
import { useChromeIdentity } from "@/components/credit-hub/shell/useChromeIdentity";
import { pendingQueueCount } from "@/lib/credit-hub/bank/bankFormat";
import { isChPanelLoading } from "@/lib/credit-hub/hooks/chQueryPanel";
import { useBankAnalytics } from "@/lib/credit-hub/hooks/useBankAnalytics";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import type { Calidad } from "@/lib/dcc/calidad";
import { formatEntero, formatMonedaCompacta, formatPorcentaje } from "@/lib/dcc/formato";
import type { MarcaDcc } from "@/lib/dcc/marca";
import { colaPorUrgencia, primerNombre, saludo } from "./mesa";
import { MetasDelMes } from "./MetasDelMes";
import { TarjetaCola } from "./TarjetaCola";
import { useKpisBanco } from "./useKpisBanco";

/** El banco aun no recibe sello de calidad del backend (N6 solo cubre al dealer). */
const SIN_SELLO: Calidad = { estado: "parcial", cubiertos: null, total: null, motivo: "El backend del banco aún no declara la calidad de esta cifra" };
const NO_DISPONIBLE = (motivo: string): Calidad => ({ estado: "no_disponible", motivo });

export type MesaProps = {
  marca: MarcaDcc;
  /** Ruta del expediente de una solicitud. */
  hrefSolicitud: (id: string) => string;
  hrefBandeja: string;
  hrefAnalitica: string;
  ahora?: Date;
};

/**
 * Mesa de decisiones (bank-v2). Mismas consultas que la Mesa actual: la cola
 * de la Bandeja, analytics/dashboard a 30 dias y kpis/portfolio + approval.
 * Lo que el backend no expone (SLA, embudo, desembolsado, actividad del dia)
 * queda en "Próximamente", con el motivo solo en el tooltip.
 */
export function MesaDecisiones({ marca, hrefSolicitud, hrefBandeja, hrefAnalitica, ahora = new Date() }: MesaProps) {
  const { apiTenantId } = useTenant();
  const identidad = useChromeIdentity();
  const colaQ = useBankQueue();
  const analyticsQ = useBankAnalytics();
  const kpisQ = useKpisBanco();
  const formato = marca.formato;
  const items = colaQ.data?.applications ?? [];
  const cola = colaPorUrgencia(items);
  const altas = cola.filter((i) => i.priority === "ALTA").length;
  const analytics = analyticsQ.data;
  const { portafolio, aprobacion } = kpisQ.data ?? {};
  const cargandoCola = isChPanelLoading(colaQ, !!apiTenantId);
  const nombre = primerNombre(identidad.name);
  // Sin analytics ni cola cargada no hay cifra: nunca un 0 por defecto.
  const pendientes = analytics || colaQ.data ? pendingQueueCount(analytics, items) : null;
  const corte = colaQ.dataUpdatedAt ? new Intl.DateTimeFormat(formato.locale, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(colaQ.dataUpdatedAt) : null;

  return (
    <DccPageMarco titulo="Mesa de decisiones" marca={marca}>
      <div className="grid gap-[var(--dcc-gap)]">
        <DccSeccion titulo="Resumen del día" icono={Sparkles} meta={corte ? `datos al ${corte}` : null} testId="mesa-brief">
          <p data-testid="mesa-saludo" className="text-lg font-semibold">
            {saludo(ahora)}
            {nombre ? `, ${nombre}` : ""}.
          </p>
          <p className={`mt-1 text-sm ${DCC_CLASSES.muted}`}>
            {cargandoCola || colaQ.isError
              ? "Preparando el resumen de la cola."
              : cola.length === 0
                ? "No tienes solicitudes pendientes."
                : `${formatEntero(cola.length, formato)} ${cola.length === 1 ? "solicitud pendiente" : "solicitudes pendientes"}; ${formatEntero(altas, formato)} de prioridad alta.`}
          </p>
        </DccSeccion>

        <div className="grid items-start gap-[var(--dcc-gap)] xl:grid-cols-[minmax(0,1fr)_340px]">
          <DccSeccion
            titulo="Cola de decisión"
            icono={Inbox}
            clave
            meta={colaQ.data ? `${formatEntero(cola.length, formato)} pendientes · por prioridad y score` : null}
            acciones={
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex items-center gap-1.5 text-xs ${DCC_CLASSES.subtle}`}>
                  Urgencia por SLA
                  <SelloCalidad calidad={NO_DISPONIBLE("La cola actual (applications/queue) no expone sla_deadline: se ordena por prioridad y score del motor")} />
                </span>
                <Link href={hrefBandeja} className={DCC_CLASSES.link}>
                  Ver bandeja
                </Link>
              </div>
            }
            testId="mesa-cola"
          >
            {colaQ.isError ? (
              <DccEstado estado="error" detalle="No pudimos cargar la cola" onReintentar={() => void colaQ.refetch()} />
            ) : cargandoCola ? (
              <DccEstado estado="cargando" />
            ) : cola.length === 0 ? (
              <DccEstado estado="vacio" detalle="Cuando llegue una solicitud aparecerá aquí, primero la más urgente." />
            ) : (
              <div>
                {cola.map((item) => (
                  <TarjetaCola key={item.application_id} item={item} formato={formato} href={hrefSolicitud(item.application_id)} />
                ))}
              </div>
            )}
          </DccSeccion>

          <div className="grid gap-[var(--dcc-gap)]">
            <DccSeccion titulo="Salud de la cartera" icono={HeartPulse} testId="mesa-salud">
              <p className={`text-xs ${DCC_CLASSES.muted}`}>Recibidas → evaluadas → ofertadas → aceptadas → desembolsadas.</p>
              <div className="mt-2">
                <SelloCalidad calidad={NO_DISPONIBLE("Falta el endpoint de embudo (kpis/funnel) con fondeado = DESEMBOLSADO")} />
              </div>
            </DccSeccion>
            <DccSeccion titulo="Red de dealers" icono={Network} meta="top por volumen · 30 d" testId="mesa-dealers">
              {analyticsQ.isError ? (
                <DccEstado estado="error" detalle="No pudimos cargar la analítica" onReintentar={() => void analyticsQ.refetch()} />
              ) : !analytics ? (
                <DccEstado estado="cargando" />
              ) : analytics.top_dealers.length === 0 ? (
                <DccEstado estado="vacio" />
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className={`text-left text-[11px] uppercase tracking-[0.06em] ${DCC_CLASSES.subtle}`}>
                      <th className="pb-2 font-semibold">Dealer</th>
                      <th className="pb-2 text-right font-semibold">Solic.</th>
                      <th className="pb-2 text-right font-semibold">Aprob.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.top_dealers.slice(0, 5).map((d) => (
                      <tr key={d.dealer} className="border-t border-[var(--dcc-border)]">
                        <td className="py-2 pr-2">{d.dealer}</td>
                        <td className="py-2 text-right tabular-nums">{formatEntero(d.volume, formato)}</td>
                        <td className="py-2 text-right tabular-nums">{formatPorcentaje(d.approval_rate, formato)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {analytics ? (
                <div className="mt-3">
                  <SelloCalidad calidad={{ estado: "parcial", cubiertos: null, total: null, motivo: "El ranking toma el dealer del payload y se corta en 500 solicitudes" }} />
                </div>
              ) : null}
            </DccSeccion>
          </div>
        </div>

        <DccSeccion titulo="Indicadores" icono={Gauge} testId="mesa-kpis">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3 xl:grid-cols-6">
            <DccKpiTile etiqueta="Solicitudes pendientes" valor={formatEntero(pendientes, formato)} calidad={pendientes != null ? SIN_SELLO : NO_DISPONIBLE("Ni la cola ni analytics respondieron")} />
            <DccKpiTile etiqueta="Tasa de aprobación · 30 d" valor={formatPorcentaje(analytics?.approval_rate, formato)} calidad={analytics ? SIN_SELLO : NO_DISPONIBLE("analytics/dashboard no respondió")} />
            <DccKpiTile
              etiqueta="Respuesta media"
              valor={aprobacion?.avg_response_hours != null ? new Intl.NumberFormat(formato.locale, { maximumFractionDigits: 1 }).format(aprobacion.avg_response_hours) : null}
              unidad="h"
              nota="Sin SLA configurado para comparar"
              calidad={aprobacion?.avg_response_hours != null ? SIN_SELLO : NO_DISPONIBLE("kpis/approval no trae avg_response_hours")}
            />
            <DccKpiTile
              etiqueta="Aprobadas"
              valor={formatEntero(aprobacion?.approved_count, formato)}
              nota={aprobacion?.declined_count != null ? `${formatEntero(aprobacion.declined_count, formato)} rechazadas` : null}
              calidad={aprobacion?.approved_count != null ? SIN_SELLO : NO_DISPONIBLE("kpis/approval no trae approved_count")}
            />
            <DccKpiTile
              etiqueta="Monto aprobado"
              valor={formatMonedaCompacta(portafolio?.total_approved_amount, formato)}
              nota={portafolio?.accepted_offers != null ? `${formatEntero(portafolio.accepted_offers, formato)} ofertas aceptadas` : null}
              calidad={portafolio?.total_approved_amount != null && formato.currency ? SIN_SELLO : NO_DISPONIBLE("Sin monto en kpis/portfolio o sin moneda en el branding")}
            />
            <DccKpiTile etiqueta="Desembolsado" valor={null} calidad={NO_DISPONIBLE("Ningún endpoint cuenta solo DESEMBOLSADO; kpis/trends suma también ofertas aceptadas")} />
          </div>
          {kpisQ.isError ? (
            <div className="mt-3">
              <DccEstado estado="error" detalle="No pudimos cargar los KPIs de aprobación" onReintentar={() => void kpisQ.refetch()} />
            </div>
          ) : null}
        </DccSeccion>

        <MetasDelMes formato={formato} />

        <div className="grid items-start gap-[var(--dcc-gap)] md:grid-cols-2">
          <DccSeccion titulo="Hoy" icono={CalendarClock} testId="mesa-hoy">
            <SelloCalidad calidad={NO_DISPONIBLE("No hay un endpoint de actividad del día de la mesa")} />
          </DccSeccion>
          <DccSeccion titulo="Reportes" icono={BarChart3} testId="mesa-reportes">
            <p className={`text-sm ${DCC_CLASSES.muted}`}>Analítica de cartera, dealers y salud del portafolio.</p>
            <Link href={hrefAnalitica} className={`mt-2 ${DCC_CLASSES.link}`}>
              Abrir analítica
            </Link>
          </DccSeccion>
        </div>
      </div>
    </DccPageMarco>
  );
}
