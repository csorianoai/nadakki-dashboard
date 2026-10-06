"use client";

import { BarChart3, Gauge, HeartPulse, Network } from "lucide-react";
import { DCC_CLASSES } from "@/components/dcc/clases";
import { DccEstado } from "@/components/dcc/DccEstado";
import { DccKpiTile } from "@/components/dcc/DccKpiTile";
import { DccPageMarco } from "@/components/dcc/DccPageMarco";
import { DccSeccion } from "@/components/dcc/DccSeccion";
import { SelloCalidad } from "@/components/dcc/SelloCalidad";
import { formatDefaultPredictionDisplay } from "@/lib/credit-hub/bank/bankFormat";
import { useBankAnalytics, useBankDealersRanking, useBankPortfolioHealth } from "@/lib/credit-hub/hooks/useBankAnalytics";
import type { Calidad } from "@/lib/dcc/calidad";
import { formatEntero, formatMonedaCompacta, formatPorcentaje } from "@/lib/dcc/formato";
import type { MarcaDcc } from "@/lib/dcc/marca";

const SIN_SELLO: Calidad = { estado: "parcial", cubiertos: null, total: null, motivo: "El backend del banco aún no declara la calidad de esta cifra" };
const NO_DISPONIBLE = (motivo: string): Calidad => ({ estado: "no_disponible", motivo });
const BANDAS_SCORE = ["300-579", "580-669", "670-739", "740-799", "800-850"] as const;

/** Barra horizontal a escala: valor / maximo. Sin eje doble. */
function Barra({ valor, max, etiqueta }: { valor: number; max: number; etiqueta: string }) {
  return (
    <div className="flex items-center gap-2" title={etiqueta}>
      <span className="h-2 flex-1 overflow-hidden rounded-sm bg-[var(--dcc-surface-muted)]">
        <span className="block h-full rounded-sm bg-[var(--dcc-teal)]" style={{ width: `${max > 0 ? (valor / max) * 100 : 0}%` }} />
      </span>
    </div>
  );
}

/**
 * Analitica (bank-v2). Las mismas tres consultas que la actual:
 * analytics/dashboard a 30 dias, dealers-ranking y portfolio-health. No hay
 * selector de periodo: el actual no vuelve a pedir datos (siempre 30 d).
 */
export function AnaliticaV2({ marca }: { marca: MarcaDcc }) {
  const analyticsQ = useBankAnalytics();
  const dealersQ = useBankDealersRanking();
  const saludQ = useBankPortfolioHealth();
  const f = marca.formato;
  const a = analyticsQ.data;

  if (analyticsQ.isError) return <DccEstado estado="error" detalle="No pudimos cargar la analítica" onReintentar={() => void analyticsQ.refetch()} />;
  if (!a) return <DccEstado estado="cargando" />;

  const ranking = dealersQ.data?.dealers ?? a.top_dealers ?? [];
  const maxVolumen = Math.max(0, ...ranking.map((d) => d.volume));
  const cohortes = a.cohort_analysis ?? [];
  const maxCohorte = Math.max(0, ...cohortes.map((c) => c.applications));
  const defaultPred = formatDefaultPredictionDisplay(a.default_prediction.predicted_default_rate, a.default_prediction.predicted_default_count, a.total_applications);
  const distribucion = (saludQ.data as { score_distribution?: Record<string, number> } | undefined)?.score_distribution;
  const maxBanda = distribucion ? Math.max(0, ...BANDAS_SCORE.map((b) => distribucion[b] ?? 0)) : 0;

  return (
    <DccPageMarco titulo="Analítica" marca={marca}>
      <div className="grid gap-[var(--dcc-gap)]">
        <DccSeccion titulo="Cartera · últimos 30 días" icono={Gauge} meta={`${formatEntero(a.total_applications, f)} solicitudes`}>
          <div className="grid grid-cols-2 gap-x-6 gap-y-4 md:grid-cols-4">
            <DccKpiTile
              etiqueta="Volumen aprobado"
              valor={formatMonedaCompacta(a.portfolio_value, f)}
              calidad={formatMonedaCompacta(a.portfolio_value, f) ? SIN_SELLO : NO_DISPONIBLE("Sin moneda en el branding")}
            />
            <DccKpiTile etiqueta="Tasa de aprobación" valor={formatPorcentaje(a.approval_rate, f)} calidad={SIN_SELLO} />
            <DccKpiTile
              etiqueta="Default predicho"
              valor={defaultPred.isExtreme ? null : `${defaultPred.percentLabel} %`}
              nota={`${formatEntero(a.default_prediction.predicted_default_count, f)} casos estimados`}
              calidad={
                defaultPred.isExtreme
                  ? NO_DISPONIBLE("Predicción extrema: el motor cuenta un score ausente como 0. No usar para decidir.")
                  : { estado: "parcial", cubiertos: null, total: null, motivo: "Regla heurística score < 600 sobre un máximo de 500 solicitudes" }
              }
            />
            <DccKpiTile
              etiqueta="Tiempo medio de decisión"
              valor={a.avg_decision_time_hours != null ? `${formatEntero(a.avg_decision_time_hours, f)} h` : null}
              calidad={a.avg_decision_time_hours != null ? SIN_SELLO : NO_DISPONIBLE("analytics/dashboard aún no calcula avg_decision_time_hours")}
            />
          </div>
        </DccSeccion>

        <DccSeccion titulo="Solicitudes y aprobación por periodo" icono={BarChart3}>
          {cohortes.length === 0 ? (
            <DccEstado estado="no_disponible" detalle="analytics/dashboard no devolvió cohort_analysis" />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className={`text-left text-[11px] uppercase tracking-[0.06em] ${DCC_CLASSES.subtle}`}>
                    <th className="pb-2 pr-3 font-semibold">Periodo</th>
                    <th className="w-1/3 pb-2 pr-3 font-semibold">Solicitudes</th>
                    <th className="pb-2 pr-3 text-right font-semibold" />
                    <th className="pb-2 pr-3 text-right font-semibold">Aprobadas</th>
                    <th className="pb-2 text-right font-semibold">Tasa</th>
                  </tr>
                </thead>
                <tbody>
                  {cohortes.map((c) => (
                    <tr key={c.period} className="border-t border-[var(--dcc-border)]">
                      <td className="py-2 pr-3">{c.period}</td>
                      <td className="py-2 pr-3">
                        <Barra valor={c.applications} max={maxCohorte} etiqueta={`${c.period}: ${c.applications} solicitudes`} />
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">{formatEntero(c.applications, f)}</td>
                      <td className="py-2 pr-3 text-right tabular-nums">{formatEntero(c.approved, f)}</td>
                      <td className="py-2 text-right tabular-nums">{formatPorcentaje(c.approval_rate, f)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </DccSeccion>

        <div className="grid items-start gap-[var(--dcc-gap)] lg:grid-cols-2">
          <DccSeccion titulo="Red de dealers" icono={Network} meta="por número de solicitudes">
            {ranking.length === 0 ? (
              <DccEstado estado="vacio" />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className={`text-left text-[11px] uppercase tracking-[0.06em] ${DCC_CLASSES.subtle}`}>
                    <th className="pb-2 pr-3 font-semibold">Dealer</th>
                    <th className="w-1/4 pb-2 pr-3 font-semibold">Solicitudes</th>
                    <th className="pb-2 pr-3 text-right font-semibold">Aprob.</th>
                    <th className="pb-2 text-right font-semibold">Tasa</th>
                  </tr>
                </thead>
                <tbody>
                  {ranking.map((d) => (
                    <tr key={d.dealer} className="border-t border-[var(--dcc-border)]">
                      <td className="py-2 pr-3">{d.dealer}</td>
                      <td className="py-2 pr-3">
                        <span className="flex items-center gap-2">
                          <Barra valor={d.volume} max={maxVolumen} etiqueta={`${d.dealer}: ${d.volume} solicitudes`} />
                          <span className="tabular-nums">{formatEntero(d.volume, f)}</span>
                        </span>
                      </td>
                      <td className="py-2 pr-3 text-right tabular-nums">{formatEntero(d.approved, f)}</td>
                      <td className="py-2 text-right tabular-nums">{formatPorcentaje(d.approval_rate, f)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="mt-3">
              <SelloCalidad calidad={{ estado: "parcial", cubiertos: null, total: null, motivo: "El ranking toma el dealer del payload y se corta en 500 solicitudes" }} />
            </div>
          </DccSeccion>

          <DccSeccion titulo="Salud del portafolio" icono={HeartPulse} meta="solicitudes por banda de score">
            {saludQ.isError ? (
              <DccEstado estado="error" detalle="No pudimos cargar la salud del portafolio" onReintentar={() => void saludQ.refetch()} />
            ) : !distribucion ? (
              <DccEstado estado="no_disponible" detalle="portfolio-health aún no expone score_distribution" />
            ) : (
              <dl className="grid gap-2 text-sm">
                {BANDAS_SCORE.map((b) => (
                  <div key={b} className="grid grid-cols-[72px_minmax(0,1fr)_56px] items-center gap-3">
                    <dt className={DCC_CLASSES.muted}>{b}</dt>
                    <Barra valor={distribucion[b] ?? 0} max={maxBanda} etiqueta={`${b}: ${distribucion[b] ?? 0}`} />
                    <dd className="text-right tabular-nums">{formatEntero(distribucion[b] ?? 0, f)}</dd>
                  </div>
                ))}
              </dl>
            )}
          </DccSeccion>
        </div>
      </div>
    </DccPageMarco>
  );
}
