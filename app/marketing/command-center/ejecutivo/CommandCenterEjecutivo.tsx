"use client";

import { useState } from "react";
import { AlertTriangle, FlaskConical } from "lucide-react";
import { CifraKpiCard, EstadoAnalitica, SelectorPeriodo, SerieTemporal } from "@/components/analytics/kit";
import { SeccionesAnaliticas } from "@/components/analytics/kit/movil";
import { TablaAnalitica, type ColumnaAnalitica } from "@/components/analytics/kit/tabla";
import { estadoEfectivo, formatearValor, type Cifra, type PeriodoAnalitica } from "@/lib/analytics/cifra";
import { StatusPill, type StatusPillTone } from "@/components/forge/ui/StatusPill";
import type { DatosCommandCenter, EstadoPantalla, FilaCampana, LecturaCampana } from "./tipos";
import { ControlInhabilitado } from "./ControlInhabilitado";
import { IndicadoresSecundarios } from "./IndicadoresSecundarios";
import { SemaforoEconomico } from "./SemaforoEconomico";
import { TiraConversiones } from "./TiraConversiones";
import { ETIQUETA_LECTURA, estaDesactualizado } from "./semaforo";
import { formatearDiaCorto, formatearInstante } from "./formato";
import { cn } from "@/lib/utils";

export interface CommandCenterEjecutivoProps {
  datos: DatosCommandCenter | null;
  /** Estado de toda la pantalla; "ok" con datos null equivale a "vacio". */
  estado?: EstadoPantalla;
  /** Instante de referencia (ISO) para decidir si el dato esta desactualizado. Lo fija el servidor. */
  ahora: string;
  /** true => datos de demostracion: banner visible. NUNCA true en produccion (la ruta ni se renderiza). */
  demo?: boolean;
  /** Periodo al que corresponden `datos`. Cualquier otro periodo no tiene datos todavia. */
  periodoDatos?: PeriodoAnalitica;
  onReintentar?: () => void;
  /** Ancho inicial de los graficos (capturas SSR). En el navegador se mide. */
  anchoGrafico?: number;
}

const TONO_LECTURA: Record<LecturaCampana, StatusPillTone> = {
  bajo_objetivo: "success",
  entre_objetivo_equilibrio: "warning",
  sobre_equilibrio: "danger",
  datos_insuficientes: "neutral",
};

const COLUMNAS: ColumnaAnalitica<FilaCampana>[] = [
  { id: "nombre", encabezado: "Campaña", tipo: "texto", texto: (f) => f.nombre },
  { id: "inversion", encabezado: "Inversión", tipo: "cifra", cifra: (f) => f.inversion },
  { id: "leads", encabezado: "Leads", tipo: "cifra", cifra: (f) => f.leads },
  { id: "cpa", encabezado: "CPA", tipo: "cifra", cifra: (f) => f.cpa },
  { id: "lectura", encabezado: "Lectura", tipo: "texto", texto: (f) => ETIQUETA_LECTURA[f.lectura] },
];

const TONO_CALIDAD = { ok: "text-forgeSuccess-700", aviso: "text-forgeWarning-700", neutro: "text-forgeGray-700" } as const;

export function CommandCenterEjecutivo({ datos, estado = "ok", ahora, demo = false, periodoDatos = { tipo: "30d" }, onReintentar, anchoGrafico }: CommandCenterEjecutivoProps) {
  const [periodo, setPeriodo] = useState<PeriodoAnalitica>(periodoDatos);
  const [comparar, setComparar] = useState(true);

  const efectivo: EstadoPantalla = estado === "ok" && !datos ? "vacio" : estado;
  const sinDatosPeriodo = periodo.tipo !== periodoDatos.tipo || (periodo.tipo === "personalizado" && periodoDatos.tipo === "personalizado" && (periodo.desde !== periodoDatos.desde || periodo.hasta !== periodoDatos.hasta));
  const instante = datos ? formatearInstante(datos.actualizado) : null;
  const desactualizado = efectivo === "ok" && datos ? estaDesactualizado(datos.actualizado, ahora) : false;

  return (
    <div className="forge-app min-h-screen bg-forgeSurface-sunken text-forgeGray-800" data-theme="light" data-testid="command-center-ejecutivo">
      {demo ? (
        <div
          data-testid="banner-demo"
          role="note"
          className="flex items-start gap-2 border-b border-forgeWarning-500/40 bg-forgeWarning-50 px-4 py-2 text-forge-xs font-semibold text-forgeWarning-700 sm:px-6"
        >
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <span>DEMO · DATOS DE EJEMPLO — no son cifras reales de ningún tenant. Disponible solo en vista previa.</span>
        </div>
      ) : null}

      <div className="mx-auto flex w-full max-w-[1440px] flex-col gap-5 px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex min-w-0 flex-col gap-4 border-b border-forgeGray-200 pb-4">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-forge-sm text-forgeGray-700">
            <span className="font-semibold text-forgeGray-900">{datos?.tenant ?? "Marketing Intelligence"}</span>
            {datos?.cuentas.map((c) => (
              <span key={c} className="flex items-center gap-2">
                <span aria-hidden>·</span>
                <span>{c}</span>
              </span>
            ))}
          </div>
          <div className="flex min-w-0 flex-wrap items-start justify-between gap-4">
            <div className="min-w-0">
              <h1 className="m-0 font-display text-[28px] font-bold leading-tight text-forgeGray-900 sm:text-[32px]">Executive Command Center</h1>
              {instante && datos ? (
                <p className="m-0 mt-1 text-forge-xs text-forgeGray-700">
                  {`Actualizado ${instante} · los ${datos.dias_incompletos} últimos días pueden recibir conversiones tardías`}
                </p>
              ) : null}
            </div>
            <div className="flex min-w-0 flex-col gap-2 sm:items-end">
              <SelectorPeriodo valor={periodo} onChange={setPeriodo} />
              <button
                type="button"
                aria-pressed={comparar}
                onClick={() => setComparar((c) => !c)}
                className={cn(
                  "min-h-[44px] rounded-forge-sm border px-3 text-forge-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-600",
                  comparar ? "border-forgeBrand-600 bg-forgeBrand-50 text-forgeBrand-800" : "border-forgeGray-200 bg-forgeSurface-card text-forgeGray-800"
                )}
              >
                Comparar: periodo anterior
              </button>
            </div>
          </div>
          <nav aria-label="Secciones de Marketing Intelligence">
            <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
              <li>
                <span aria-current="page" className="inline-flex min-h-[44px] items-center rounded-forge-sm bg-forgeBrand-700 px-3 text-forge-sm font-semibold text-white">
                  Command Center
                </span>
              </li>
              <li>
                <ControlInhabilitado disponibleCuando="exista Campaign Intelligence (se construye tras la aprobación de esta pantalla patrón)">Campaign Intelligence</ControlInhabilitado>
              </li>
              <li>
                <ControlInhabilitado disponibleCuando="exista Conversiones e ingresos (se construye tras la aprobación de esta pantalla patrón)">Conversiones e ingresos</ControlInhabilitado>
              </li>
              <li>
                <ControlInhabilitado disponibleCuando="exista el flujo formal de aprobaciones">Aprobaciones</ControlInhabilitado>
              </li>
              <li>
                <ControlInhabilitado disponibleCuando="exista el modelo económico editable (B2-T1)">Modelo económico</ControlInhabilitado>
              </li>
            </ul>
          </nav>
        </header>

        {desactualizado && datos ? (
          <div data-testid="aviso-desactualizado" role="status" className="flex items-start gap-2 rounded-forge-sm border border-forgeWarning-500/40 bg-forgeWarning-50 px-3 py-2 text-forge-sm text-forgeWarning-700">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p className="m-0">
              <strong>Datos desactualizados.</strong> {`El último dato es del ${instante}. Las cifras pueden no reflejar el estado actual.`}
            </p>
          </div>
        ) : null}

        {efectivo !== "ok" || !datos ? (
          <EstadoAnalitica estado={efectivo === "ok" ? "vacio" : efectivo} onReintentar={onReintentar} />
        ) : sinDatosPeriodo ? (
          <div data-testid="aviso-periodo" role="status" className="rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-4 text-forge-sm text-forgeGray-800">
            <EstadoAnalitica
              estado="pendiente_integracion"
              descripcion="La vista previa solo incluye 30 días. Con datos reales, cada periodo se consulta a la fuente (T6a) y mostrará su propia fecha de dato."
            />
          </div>
        ) : (
          <SeccionesAnaliticas
            secciones={[
              { id: "resumen", titulo: "Resumen", contenido: <Resumen datos={datos} comparar={comparar} anchoGrafico={anchoGrafico} /> },
              { id: "campanas", titulo: "Campañas", contenido: <Campanas datos={datos} /> },
              { id: "calidad", titulo: "Calidad de los datos", contenido: <Calidad datos={datos} /> },
            ]}
          />
        )}
      </div>
    </div>
  );
}

function Resumen({ datos, comparar, anchoGrafico }: { datos: DatosCommandCenter; comparar: boolean; anchoGrafico?: number }) {
  const s = datos.serie;
  const n = Math.min(datos.dias_incompletos, s.gasto.length);
  const rango = n > 0 && s.gasto.length > 0 ? `${formatearDiaCorto(s.gasto[s.gasto.length - n].x)}–${formatearDiaCorto(s.gasto[s.gasto.length - 1].x)}` : null;
  return (
    <div className="flex min-w-0 flex-col gap-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CifraKpiCard cifra={datos.inversion} />
        <div data-testid="kpi-cpa" className="relative order-first min-w-0 sm:order-none">
          <StatusPill
            tone={estadoEfectivo(datos.cpa) === "ok" ? TONO_LECTURA[lecturaDe(datos)] : "neutral"}
            data-testid="cpa-lectura"
            className="absolute right-4 top-4 z-10"
          >
            {estadoEfectivo(datos.cpa) === "ok" ? ETIQUETA_LECTURA[lecturaDe(datos)] : "Sin lectura"}
          </StatusPill>
          <CifraKpiCard cifra={datos.cpa} />
          {datos.supuestos.objetivo !== null && datos.supuestos.equilibrio !== null && estadoEfectivo(datos.cpa) === "ok" ? (
            <p className="m-0 mt-2 px-1 text-forge-xs text-forgeGray-700">
              {`Objetivo ${formatearValor({ valor: datos.supuestos.objetivo, unidad: "moneda", moneda: datos.supuestos.moneda })} · equilibrio ${formatearValor({ valor: datos.supuestos.equilibrio, unidad: "moneda", moneda: datos.supuestos.moneda })}${
                datos.cpa.valor_anterior !== null ? ` · antes ${formatearValor({ valor: datos.cpa.valor_anterior, unidad: "moneda", moneda: datos.cpa.moneda })}` : ""
              }`}
            </p>
          ) : null}
        </div>
        <CifraKpiCard cifra={datos.leads} />
      </div>

      <IndicadoresSecundarios cifras={datos.secundarias} />

      <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
          {rango ? (
            <p className="m-0 text-forge-xs text-forgeWarning-700" data-testid="nota-incompleto">
              {`Los ${n} últimos días (${rango}) pueden estar incompletos.`}
            </p>
          ) : null}
          <SerieTemporal
            meta={{ titulo: "Inversión diaria · 30 días", descripcion: comparar ? "Línea discontinua: periodo anterior" : undefined, fuente: s.fuente, fecha_dato: s.fecha_dato }}
            datos={{ actual: s.gasto, anterior: comparar ? s.gasto_anterior : undefined }}
            unidad="moneda"
            moneda={datos.inversion.moneda}
            ancho={anchoGrafico}
          />
          {s.conversiones.length > 0 && s.gasto.length > 0 ? <TiraConversiones conversiones={s.conversiones} diasIncompletos={datos.dias_incompletos} /> : null}
        </div>
        <SemaforoEconomico cpa={datos.cpa} conversiones={datos.conversiones_total} supuestos={datos.supuestos} />
      </div>
    </div>
  );
}

function lecturaDe(datos: DatosCommandCenter): LecturaCampana {
  const { objetivo, equilibrio } = datos.supuestos;
  const v = datos.cpa.valor;
  if (v === null || objetivo === null || equilibrio === null) return "datos_insuficientes";
  // Misma regla que el semaforo; se reimplementa aqui solo como lectura de la pastilla del KPI.
  if (!Number.isFinite(v) || objetivo <= 0 || equilibrio <= 0 || equilibrio < objetivo) return "datos_insuficientes";
  return v <= objetivo ? "bajo_objetivo" : v <= equilibrio ? "entre_objetivo_equilibrio" : "sobre_equilibrio";
}

function Campanas({ datos }: { datos: DatosCommandCenter }) {
  const d = datos.decisiones;
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-2 lg:col-span-2">
        <TablaAnalitica titulo="Campañas" columnas={COLUMNAS} filas={datos.campanas} obtenerId={(f) => f.id} />
        <p className="m-0 text-forge-xs text-forgeGray-700">Menos de 5 conversiones: «Datos insuficientes», sin CPA ni juicio de rentabilidad.</p>
      </div>
      <section aria-labelledby="decisiones-t" className="flex min-w-0 flex-col gap-3 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-4">
        <h3 id="decisiones-t" className="m-0 font-display text-forge-base font-semibold text-forgeGray-800">
          Decisiones pendientes
        </h3>
        {d.negativas_propuestas !== null && d.negativas_propuestas > 0 ? (
          <div className="flex min-w-0 flex-col gap-2 rounded-forge-sm bg-forgeSurface-sunken p-3 text-forge-sm text-forgeGray-800">
            <span>
              {`${d.negativas_propuestas} negativas propuestas`}
              {d.riesgo && estadoEfectivo(d.riesgo) === "ok" ? ` · ${formatearValor(d.riesgo)} en riesgo` : ""}
            </span>
            <ControlInhabilitado disponibleCuando="exista Campaign Intelligence y el flujo de aprobación de propuestas" visible>
              Revisar propuestas
            </ControlInhabilitado>
          </div>
        ) : (
          <p className="m-0 rounded-forge-sm border border-dashed border-forgeGray-300 p-3 text-forge-sm text-forgeGray-700">Sin propuestas</p>
        )}
        <div className="flex justify-between gap-2 rounded-forge-sm border border-dashed border-forgeGray-300 p-3 text-forge-sm text-forgeGray-700">
          <span>Presupuesto</span>
          <span>{d.presupuesto_propuestas ? `${d.presupuesto_propuestas} propuestas` : "Sin propuestas"}</span>
        </div>
        <p className="m-0 text-forge-xs text-forgeGray-700">Nada se ejecuta solo: cada decisión pide tu aprobación y luego un permiso por acción.</p>
      </section>
    </div>
  );
}

function Calidad({ datos }: { datos: DatosCommandCenter }) {
  return (
    <section aria-label="Estado de la calidad de los datos" className="min-w-0 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-4">
      <dl className="m-0 flex flex-col gap-2 text-forge-sm">
        {datos.calidad.map((q) => (
          <div key={q.id} className="flex min-w-0 justify-between gap-3">
            <dt className="min-w-0">{q.etiqueta}</dt>
            <dd className={cn("m-0 shrink-0 font-semibold", TONO_CALIDAD[q.tono])}>{q.estado}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
