"use client";

import { useState } from "react";
import { AlertTriangle, FlaskConical, Moon, Sun } from "lucide-react";
import { EstadoAnalitica, FormatoProvider, SelectorPeriodo, SerieTemporal, useFormato } from "@/components/analytics/kit";
import { useEsMovil } from "@/components/analytics/kit/movil";
import { TablaAnalitica, type ColumnaAnalitica } from "@/components/analytics/kit/tabla";
import "@/components/analytics/kit/tema.css";
import { estadoEfectivo, formatearValor, type PeriodoAnalitica } from "@/lib/analytics/cifra";
import type { FormatoTenant } from "@/lib/analytics/formato";
import type { DatosCommandCenter, EstadoPantalla, FilaCampana, TemaPantalla } from "./tipos";
import { ControlInhabilitado } from "./ControlInhabilitado";
import { PestanasMoviles } from "./PestanasMoviles";
import { IndicadoresSecundarios } from "./IndicadoresSecundarios";
import { KpiDominante } from "./KpiDominante";
import { AvisoMinimo, AvisoRentabilidad, FuentesResumen, ResumenSupuestos, SemaforoEconomico, rendimientoDe } from "./SemaforoEconomico";
import { TiraConversiones } from "./TiraConversiones";
import { ETIQUETA_MUESTRA, estaDesactualizado, fraseCpa, lecturaCampana, textoMuestra } from "./semaforo";
import { etiquetaPeriodo, formatearDiaCorto, formatearInstante } from "./formato";
import { AVISO_ATENCION, BOTON, BOTON_ACTIVO, CHIP_ATENCION, CHIP_ERROR, CHIP_OK, CHIP_PENDIENTE, HUNDIDO, NOTA, PANEL, TARJETA, TITULO_PANEL } from "./estilos";
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
  /** Tema inicial. Por defecto OSCURO (azul noche, el diseno aprobado); el boton de la cabecera lo alterna. */
  tema?: TemaPantalla;
  /** Locale y moneda del tenant (formatoDesdeTenant). Sin valor => es-US / USD. Nada de esto esta fijo en la pantalla. */
  formato?: Partial<FormatoTenant> | null;
}

const COLUMNAS: ColumnaAnalitica<FilaCampana>[] = [
  { id: "nombre", encabezado: "Campaña", tipo: "texto", texto: (f) => f.nombre },
  { id: "inversion", encabezado: "Inversión", tipo: "cifra", cifra: (f) => f.inversion },
  { id: "leads", encabezado: "Leads", tipo: "cifra", cifra: (f) => f.leads },
  { id: "cpa", encabezado: "CPA", tipo: "cifra", cifra: (f) => f.cpa },
  { id: "lectura", encabezado: "Lectura", tipo: "texto", texto: (f) => lecturaCampana(f.lectura, f.leads.valor) },
];

const TONO_CALIDAD = { ok: "kit-txt-ok", aviso: "kit-txt-atencion", neutro: "kit-txt-2" } as const;

export function CommandCenterEjecutivo({ formato, ...props }: CommandCenterEjecutivoProps) {
  return (
    <FormatoProvider formato={formato}>
      <Pantalla {...props} />
    </FormatoProvider>
  );
}

function Pantalla({ datos, estado = "ok", ahora, demo = false, periodoDatos = { tipo: "30d" }, onReintentar, anchoGrafico, tema: temaInicial = "dark" }: Omit<CommandCenterEjecutivoProps, "formato">) {
  const formato = useFormato();
  const movil = useEsMovil();
  const [periodo, setPeriodo] = useState<PeriodoAnalitica>(periodoDatos);
  const [comparar, setComparar] = useState(true);
  const [tema, setTema] = useState<TemaPantalla>(temaInicial);

  const efectivo: EstadoPantalla = estado === "ok" && !datos ? "vacio" : estado;
  const sinDatosPeriodo = periodo.tipo !== periodoDatos.tipo || (periodo.tipo === "personalizado" && periodoDatos.tipo === "personalizado" && (periodo.desde !== periodoDatos.desde || periodo.hasta !== periodoDatos.hasta));
  const instante = datos ? formatearInstante(datos.actualizado, formato) : null;
  const desactualizado = efectivo === "ok" && datos ? estaDesactualizado(datos.actualizado, ahora) : false;
  const oscuro = tema === "dark";
  const periodoEtiqueta = etiquetaPeriodo(periodo, formato);

  const navegacion = (
    <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
      <li>
        <span aria-current="page" className={cn(BOTON_ACTIVO, "cursor-default")}>
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
  );

  const botonComparar = (
    <button type="button" aria-pressed={comparar} onClick={() => setComparar((c) => !c)} className={comparar ? BOTON_ACTIVO : BOTON}>
      Comparar: periodo anterior
    </button>
  );
  const botonTema = (
    <button
      type="button"
      aria-pressed={oscuro}
      aria-label={oscuro ? "Tema oscuro (activo). Cambiar a claro" : "Tema claro (activo). Cambiar a oscuro"}
      onClick={() => setTema(oscuro ? "light" : "dark")}
      className={BOTON}
    >
      {oscuro ? <Moon className="mr-1.5 h-4 w-4" aria-hidden /> : <Sun className="mr-1.5 h-4 w-4" aria-hidden />}
      {oscuro ? "Oscuro" : "Claro"}
    </button>
  );

  return (
    <div className="forge-app kit-tema kit-fondo min-h-screen" data-theme={tema} data-testid="command-center-ejecutivo">
      {demo ? (
        <div data-testid="banner-demo" role="note" className={cn("flex items-start gap-2 px-4 text-[12px] font-semibold sm:px-6 lg:px-8", movil ? "py-1 text-[11px]" : "py-2", AVISO_ATENCION)}>
          <FlaskConical className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          {movil ? <span>DEMO · datos de ejemplo, no son cifras reales</span> : <span>DEMO · DATOS DE EJEMPLO — no son cifras reales de ningún tenant. Solo vista previa.</span>}
        </div>
      ) : null}

      <div className={cn("mx-auto flex w-full max-w-[1600px] flex-col px-4 sm:px-6 lg:gap-5 lg:px-8 lg:py-5", movil ? "gap-3 py-3" : "gap-4 py-4")}>
        {movil ? (
          <header className="flex min-w-0 flex-col gap-2 border-b kit-bd pb-2">
            <div className="flex min-w-0 items-center gap-3">
              <span aria-hidden className="kit-bg-acento kit-txt-sobre-acento flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] font-display text-[16px] font-bold">
                N
              </span>
              <div className="min-w-0">
                <p className="m-0 text-[12px] font-semibold leading-tight kit-txt-3">{datos?.tenant ?? "Marketing Intelligence"}</p>
                <h1 className="m-0 font-display text-[20px] font-bold leading-tight tracking-[-0.01em] kit-txt">Executive Command Center</h1>
              </div>
            </div>
            {/* Un solo bloque expandible reune el periodo, comparar, el tema y las otras secciones: la cabecera ocupa una fila de 44 px. */}
            <details data-testid="detalle-secciones" className={cn(HUNDIDO, "px-3 py-0")}>
              <summary className="kit-foco flex min-h-[44px] cursor-pointer flex-col justify-center py-1 text-[13px] font-medium kit-txt-2" data-testid="subtitulo-movil">
                <span>{`Periodo y opciones · ${periodoEtiqueta}`}</span>
                {instante ? <span className="text-[12px] font-normal kit-txt-3">{`Actualizado ${instante}`}</span> : null}
              </summary>
              <div className="flex flex-col gap-3 pb-3">
                <SelectorPeriodo valor={periodo} onChange={setPeriodo} />
                {datos?.cuentas.length ? <p className="m-0 text-[12px] kit-txt-3">{`Cuentas: ${datos.cuentas.join(" · ")}`}</p> : null}
                <div className="flex flex-wrap gap-2">
                  {botonComparar}
                  {botonTema}
                </div>
                <nav aria-label="Secciones de Marketing Intelligence">{navegacion}</nav>
              </div>
            </details>
          </header>
        ) : (
          <header className="flex min-w-0 flex-col gap-3 border-b kit-bd pb-4">
            <div className="flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <div className="flex min-w-0 flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] kit-txt-3">
                <span aria-hidden className="kit-bg-acento kit-txt-sobre-acento flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] font-display text-[15px] font-bold">
                  N
                </span>
                <span className="font-semibold kit-txt">{datos?.tenant ?? "Marketing Intelligence"}</span>
                {datos?.cuentas.map((c) => (
                  <span key={c} className="flex items-center gap-2">
                    <span aria-hidden>·</span>
                    <span>{c}</span>
                  </span>
                ))}
              </div>
              <nav aria-label="Secciones de Marketing Intelligence">{navegacion}</nav>
            </div>

            <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-4 gap-y-3">
              <div className="min-w-0">
                <h1 className="m-0 font-display text-[30px] font-bold leading-tight tracking-[-0.015em] kit-txt lg:text-[32px]">Executive Command Center</h1>
                {instante && datos ? <p className="m-0 mt-1 text-[12px] kit-txt-3">{`Actualizado ${instante} · los ${datos.dias_incompletos} últimos días pueden recibir conversiones tardías`}</p> : null}
              </div>
              <div className="flex min-w-0 flex-wrap items-center gap-2 sm:justify-end">
                <SelectorPeriodo valor={periodo} onChange={setPeriodo} />
                {botonComparar}
                {botonTema}
              </div>
            </div>
          </header>
        )}

        {desactualizado && datos ? (
          <div data-testid="aviso-desactualizado" role="status" className={cn("flex items-start gap-2 rounded-[10px] px-3 py-2 text-[13px]", AVISO_ATENCION)}>
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
            <p className="m-0">
              <strong>Datos desactualizados.</strong> {`El último dato es del ${instante}. Las cifras pueden no reflejar el estado actual.`}
            </p>
          </div>
        ) : null}

        {efectivo !== "ok" || !datos ? (
          <EstadoAnalitica estado={efectivo === "ok" ? "vacio" : efectivo} onReintentar={onReintentar} />
        ) : sinDatosPeriodo ? (
          <div data-testid="aviso-periodo" role="status" className={cn(PANEL, "p-4 text-[13px] kit-txt-2")}>
            <EstadoAnalitica
              estado="pendiente_integracion"
              descripcion="La vista previa solo incluye 30 días. Con datos reales, cada periodo se consulta a la fuente (T6a) y mostrará su propia fecha de dato."
            />
          </div>
        ) : movil ? (
          <PestanasMoviles
            pestanas={[
              { id: "resumen", titulo: "Resumen", contenido: <Resumen datos={datos} comparar={comparar} anchoGrafico={anchoGrafico} movil /> },
              { id: "campanas", titulo: "Campañas", contenido: <Campanas datos={datos} /> },
              { id: "calidad", titulo: "Calidad", contenido: <Calidad datos={datos} /> },
            ]}
          />
        ) : (
          <div className="flex min-w-0 flex-col gap-6">
            <section aria-label="Resumen" className="min-w-0">
              <Resumen datos={datos} comparar={comparar} anchoGrafico={anchoGrafico} movil={false} />
            </section>
            <section aria-labelledby="seccion-campanas" className="min-w-0">
              <h2 id="seccion-campanas" className="mb-3 font-display text-[18px] font-semibold kit-txt">
                Campañas
              </h2>
              <Campanas datos={datos} />
            </section>
            <section aria-labelledby="seccion-calidad" className="min-w-0">
              <h2 id="seccion-calidad" className="mb-3 font-display text-[18px] font-semibold kit-txt">
                Calidad de los datos
              </h2>
              <Calidad datos={datos} />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}

function Resumen({ datos, comparar, anchoGrafico, movil }: { datos: DatosCommandCenter; comparar: boolean; anchoGrafico?: number; movil: boolean }) {
  const formato = useFormato();
  const s = datos.serie;
  const n = Math.min(datos.dias_incompletos, s.gasto.length);
  const rango = n > 0 && s.gasto.length > 0 ? `${formatearDiaCorto(s.gasto[s.gasto.length - n].x, formato)}–${formatearDiaCorto(s.gasto[s.gasto.length - 1].x, formato)}` : null;
  const r = rendimientoDe(datos.cpa, datos.conversiones_total, datos.supuestos);
  const usd = (v: number | null) => formatearValor({ valor: v, unidad: "moneda", moneda: datos.supuestos.moneda }, formato);
  const cpaOk = estadoEfectivo(datos.cpa) === "ok";

  // Tres estados de muestra (decision de Cesar, 10-nov-2026): el chip nunca es verde/rojo; el semaforo y la barra llevan el color.
  const chipCpa = (
    <span className={CHIP_PENDIENTE} data-testid="cpa-lectura">
      {!cpaOk || !r ? "Sin lectura" : ETIQUETA_MUESTRA[r.muestra]}
    </span>
  );

  const cpa = (
    <div data-testid="kpi-cpa" className="col-span-2 min-w-0 sm:col-span-1">
      <KpiDominante
        cifra={datos.cpa}
        chip={chipCpa}
        tamano="hero"
        compacto={movil}
        corto={movil}
        sinFuente={movil}
        borde={r && !r.preliminar && r.lectura === "bajo_objetivo" ? "acento" : "neutro"}
        className="h-full"
      >
        {cpaOk && r ? (
          <>
            <p data-testid="cpa-vs-objetivo" className="m-0 text-[13px] font-medium kit-txt">
              {fraseCpa(r.lectura, r.muestra)}
              {datos.supuestos.objetivo !== null && r.lectura === "bajo_objetivo" && r.muestra !== "muy_limitada" ? ` (${usd(datos.supuestos.objetivo)})` : ""}
            </p>
            <p data-testid="cpa-muestra" className="m-0 text-[12px] kit-txt-2">
              {textoMuestra(datos.conversiones_total, movil)}
            </p>
          </>
        ) : null}
        {movil && r ? <SemaforoEconomico cpa={datos.cpa} conversiones={datos.conversiones_total} supuestos={datos.supuestos} variante="barra" className="pt-1" /> : null}
        {movil ? (
          /* Aviso minimo dentro de la tarjeta del CPA: ausencia de cierres CRM y supuestos (objetivo y equilibrio) SIEMPRE visibles. */
          <AvisoMinimo supuestos={datos.supuestos} cierres={r?.cierres ?? datos.supuestos.cierres_crm} rentabilidad={r?.rentabilidad ?? "sin_confirmar"} className="mt-1" />
        ) : (
          <>
            <ResumenSupuestos supuestos={datos.supuestos} />
            <AvisoRentabilidad cierres={r?.cierres ?? datos.supuestos.cierres_crm} rentabilidad={r?.rentabilidad ?? "sin_confirmar"} />
          </>
        )}
      </KpiDominante>
    </div>
  );

  const grafico = (
    <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
      {rango ? (
        <p className="m-0 text-[12px] kit-txt-atencion" data-testid="nota-incompleto">
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
  );

  return (
    <div className={cn("flex min-w-0 flex-col", movil ? "gap-3" : "gap-4")}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:gap-4">
        {/* Movil: el CPA (la lectura) va primero, ancho completo; Inversion y Leads debajo, lado a lado y compactos. Los tres caben en el
            primer viewport de 320x568. Escritorio: Inversion, CPA y Leads, con el CPA al centro como en el diseno. */}
        {movil ? cpa : null}
        <KpiDominante cifra={datos.inversion} tamano="normal" corto={movil} compacto={movil} sinFuente={movil} />
        {movil ? null : cpa}
        <KpiDominante cifra={datos.leads} tamano="normal" corto={movil} compacto={movil} sinFuente={movil} />
      </div>

      {movil ? (
        <>
          <FuentesResumen cifras={[datos.inversion, datos.cpa, datos.leads].map((c) => ({ etiqueta: c.etiqueta, fuente: c.fuente, fecha_dato: c.fecha_dato }))} />
          {grafico}
          <details data-testid="detalle-secundarios" className={cn(PANEL, "px-4")}>
            <summary className="kit-foco flex min-h-[44px] cursor-pointer items-center text-[13px] font-medium kit-txt-2">Indicadores secundarios (clics, CPC, impresiones, CTR)</summary>
            <div className="pb-4">
              <IndicadoresSecundarios cifras={datos.secundarias} />
            </div>
          </details>
          <details data-testid="detalle-supuestos" className={cn(PANEL, "px-4")}>
            <summary className="kit-foco flex min-h-[44px] cursor-pointer items-center text-[13px] font-medium kit-txt-2">Supuestos financieros y fuentes</summary>
            <div className="pb-4">
              <SemaforoEconomico cpa={datos.cpa} conversiones={datos.conversiones_total} supuestos={datos.supuestos} sinBarra />
            </div>
          </details>
        </>
      ) : (
        <>
          {/* Jerarquia ejecutiva: el grafico principal y el semaforo van justo debajo de los tres KPI; los secundarios, despues. */}
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
            {grafico}
            <SemaforoEconomico cpa={datos.cpa} conversiones={datos.conversiones_total} supuestos={datos.supuestos} />
          </div>
          <IndicadoresSecundarios cifras={datos.secundarias} />
        </>
      )}
    </div>
  );
}

function Campanas({ datos }: { datos: DatosCommandCenter }) {
  const d = datos.decisiones;
  const formato = useFormato();
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-2 lg:col-span-2">
        <TablaAnalitica titulo="Campañas" columnas={COLUMNAS} filas={datos.campanas} obtenerId={(f) => f.id} />
        <p className="m-0 text-[12px] kit-txt-2">Menos de 5 conversiones: «Datos insuficientes», sin CPA ni juicio de rentabilidad. De 5 a 14: lectura preliminar. Desde 15: muestra de seguimiento, con incertidumbre.</p>
      </div>
      <section aria-labelledby="decisiones-t" className={cn(PANEL, "flex flex-col gap-3 p-4")}>
        <h3 id="decisiones-t" className={cn(TITULO_PANEL, "text-[16px]")}>
          Decisiones pendientes
        </h3>
        {d.negativas_propuestas !== null && d.negativas_propuestas > 0 ? (
          <div className={cn(HUNDIDO, "flex min-w-0 flex-col gap-2 p-3 text-[13px] kit-txt")}>
            <span>
              {`${d.negativas_propuestas} negativas propuestas`}
              {d.riesgo && estadoEfectivo(d.riesgo) === "ok" ? ` · ${formatearValor(d.riesgo, formato)} en riesgo` : ""}
            </span>
            <ControlInhabilitado disponibleCuando="exista Campaign Intelligence y el flujo de aprobación de propuestas" visible>
              Revisar propuestas
            </ControlInhabilitado>
          </div>
        ) : (
          <p className="m-0 rounded-[10px] border border-dashed kit-bd-control p-3 text-[13px] kit-txt-2">Sin propuestas</p>
        )}
        <div className="flex justify-between gap-2 rounded-[10px] border border-dashed kit-bd-control p-3 text-[13px] kit-txt-2">
          <span>Presupuesto</span>
          <span>{d.presupuesto_propuestas ? `${d.presupuesto_propuestas} propuestas` : "Sin propuestas"}</span>
        </div>
        <p className="m-0 text-[12px] kit-txt-2">Nada se ejecuta solo: cada decisión pide tu aprobación y luego un permiso por acción.</p>
      </section>
    </div>
  );
}

function Calidad({ datos }: { datos: DatosCommandCenter }) {
  return (
    <section aria-label="Estado de la calidad de los datos" className={cn(TARJETA, "rounded-[14px] p-4")}>
      <dl className="m-0 flex flex-col gap-2 text-[13px] kit-txt">
        {datos.calidad.map((q) => (
          <div key={q.id} className="flex min-w-0 justify-between gap-3">
            <dt className="min-w-0">{q.etiqueta}</dt>
            <dd className={cn("m-0 shrink-0 font-semibold", TONO_CALIDAD[q.tono])}>{q.estado}</dd>
          </div>
        ))}
      </dl>
      <p className={cn("m-0 mt-3", NOTA)}>Cierres reales (CRM) pendientes: sin ellos no se confirma la rentabilidad.</p>
    </section>
  );
}
