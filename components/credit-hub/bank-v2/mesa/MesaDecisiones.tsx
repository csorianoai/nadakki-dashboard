"use client";

import Link from "next/link";
import { BarChart3, BellRing, CalendarClock, Gauge, HeartPulse, Inbox, Network, Sparkles } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccKpiTile } from "@/components/dcc/DccKpiTile";
import { DccPageMarco } from "@/components/dcc/DccPageMarco";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { SelloCalidad } from "@/components/dcc/SelloCalidad";
import { useChromeIdentity } from "@/components/credit-hub/shell/useChromeIdentity";
import { isChPanelLoading } from "@/lib/credit-hub/hooks/chQueryPanel";
import { useBankAnalytics } from "@/lib/credit-hub/hooks/useBankAnalytics";
import { useBankQueue } from "@/lib/credit-hub/hooks/useBankQueue";
import { currentGoalsPeriod } from "@/lib/credit-hub/api/goalsClient";
import { useMonthlyGoals } from "@/lib/credit-hub/hooks/useMonthlyGoals";
import { useTenant } from "@/lib/credit-hub/hooks/useTenant";
import { formatEntero } from "@/lib/dcc/formato";
import type { MarcaDcc } from "@/lib/dcc/marca";
import { porcentaje } from "../comun/formato";
import { parcialSiLimite, proximamente } from "../comun/llano";
import { alertasMesa } from "./alertas";
import { colaPorUrgencia, primerNombre, saludo } from "./mesa";
import { MetasDelMes } from "./MetasDelMes";
import { TarjetaCola } from "./TarjetaCola";
import { textosKpis, useKpisBanco } from "./useKpisBanco";
import { nombreOIdentificadorOculto } from "../comun/nombres";

/**
 * El backend del banco aun no declara calidad (N6 solo cubre al dealer): una
 * cifra que llega se pinta sin sello, y "parcial" solo cuando el dato dice que
 * no cubre todo. Lo que falta dice "Próximamente" en llano; el porque tecnico
 * va al bloque plegado "Detalle técnico".
 */
const URGENCIA_LLANO = "La urgencia por plazo estará disponible próximamente; por ahora la cola se ordena por prioridad y score.";
const EMBUDO_LLANO = "El embudo de la cartera, de solicitudes recibidas a desembolsadas, estará disponible próximamente.";
const HOY_LLANO = "La actividad del día estará disponible próximamente.";

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
 * de la Bandeja, analytics/dashboard a 30 dias (solo dealers) y los agregados de useKpisBanco.
 * Lo que el backend no expone (SLA, embudo, desembolsado, actividad del dia)
 * queda en "Próximamente" con una frase llana; el detalle tecnico, plegado.
 */
export function MesaDecisiones({ marca, hrefSolicitud, hrefBandeja, hrefAnalitica, ahora = new Date() }: MesaProps) {
  const { apiTenantId } = useTenant();
  const identidad = useChromeIdentity();
  const colaQ = useBankQueue();
  const analyticsQ = useBankAnalytics();
  const kpisQ = useKpisBanco();
  // Misma consulta (y misma clave de cache) que MetasDelMes: no hay peticion extra.
  const metasQ = useMonthlyGoals("bank", currentGoalsPeriod());
  const formato = marca.formato;
  const items = colaQ.data?.applications ?? [];
  const cola = colaPorUrgencia(items);
  const altas = cola.filter((i) => i.priority === "ALTA").length;
  const analytics = analyticsQ.data;
  const k = textosKpis(kpisQ.data, formato);
  const cargandoCola = isChPanelLoading(colaQ, !!apiTenantId);
  const nombre = primerNombre(identidad.name);
  const alertas = colaQ.data ? alertasMesa({ items, metas: metasQ.data?.goals ?? [], periodo: metasQ.data?.period ?? currentGoalsPeriod(), ahora }) : null;
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

        {alertas ? (
          <DccSeccion titulo="Alertas" icono={BellRing} meta={alertas.length ? `${formatEntero(alertas.length, formato)} activas` : null} testId="mesa-alertas">
            {alertas.length === 0 ? (
              <p className={`text-sm ${DCC_CLASSES.muted}`}>Sin alertas por ahora.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
                {alertas.map((a) => (
                  <li
                    key={a.id}
                    data-testid="mesa-alerta"
                    data-tono={a.tono}
                    className={`rounded-lg border px-3 py-2 text-sm ${a.tono === "alta" ? "border-[var(--dcc-error-fg)] bg-[var(--dcc-error-bg)]" : "border-[var(--dcc-partial-line)] bg-[var(--dcc-partial-bg)]"}`}
                  >
                    <p className="font-semibold">{a.titulo}</p>
                    <p className={`text-xs ${DCC_CLASSES.muted}`}>{a.detalle}</p>
                    {a.id.startsWith("meta-") ? null : (
                      <Link href={hrefBandeja} className={`mt-1 text-xs ${DCC_CLASSES.link}`}>
                        Ver en la bandeja
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </DccSeccion>
        ) : null}

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
                  <SelloCalidad calidad={proximamente(URGENCIA_LLANO)} />
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
              <SelloCalidad calidad={proximamente(EMBUDO_LLANO)} />
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
                        <td className="py-2 pr-2">{nombreOIdentificadorOculto(d.dealer)}</td>
                        <td className="py-2 text-right tabular-nums">{formatEntero(d.volume, formato)}</td>
                        <td className="py-2 text-right tabular-nums">{porcentaje(d.approval_rate, formato)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {analytics && parcialSiLimite(analytics.total_applications) ? (
                <div className="mt-3">
                  <SelloCalidad calidad={parcialSiLimite(analytics.total_applications)!} />
                </div>
              ) : null}
            </DccSeccion>
          </div>
        </div>

        <DccSeccion titulo="Indicadores" icono={Gauge} testId="mesa-kpis">
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-3 xl:grid-cols-6">
            <DccKpiTile etiqueta="Solicitudes pendientes" valor={k.pendientes} calidad={k.pendientes != null ? null : proximamente()} />
            <DccKpiTile etiqueta="Tasa de aprobación" valor={k.tasa} calidad={k.tasa != null ? null : proximamente()} />
            <DccKpiTile
              etiqueta="Respuesta media"
              valor={k.tiempoMedio}
              unidad="h"
              nota="Sin SLA configurado para comparar"
              calidad={k.tiempoMedio != null ? null : proximamente()}
            />
            <DccKpiTile
              etiqueta="Aprobadas"
              valor={k.aprobadas}
              nota={k.rechazadas != null ? `${k.rechazadas} rechazadas` : null}
              calidad={k.aprobadas != null ? null : proximamente()}
            />
            <DccKpiTile
              etiqueta="Monto aprobado"
              valor={k.monto}
              nota={k.ofertasAceptadas != null ? `${k.ofertasAceptadas} ofertas aceptadas` : null}
              calidad={k.monto != null ? null : proximamente()}
            />
            <DccKpiTile etiqueta="Desembolsado" valor={null} calidad={proximamente()} />
          </div>
          {kpisQ.isError ? (
            <div className="mt-3">
              <DccEstado estado="error" detalle="No pudimos cargar los KPIs de aprobación" onReintentar={() => void kpisQ.refetch()} />
            </div>
          ) : null}
        </DccSeccion>

        <MetasDelMes formato={formato} ahora={ahora} />

        <div className="grid items-start gap-[var(--dcc-gap)] md:grid-cols-2">
          <DccSeccion titulo="Hoy" icono={CalendarClock} testId="mesa-hoy">
            <SelloCalidad calidad={proximamente(HOY_LLANO)} />
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
