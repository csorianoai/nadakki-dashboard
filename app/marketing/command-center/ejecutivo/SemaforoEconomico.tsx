"use client";

import { AlertTriangle, Check, CircleDashed, XCircle } from "lucide-react";
import { EstadoAnalitica, useFormato } from "@/components/analytics/kit";
import { estadoEfectivo, formatearFecha, formatearPorcentaje, formatearValor, type Cifra } from "@/lib/analytics/cifra";
import type { SupuestosEconomicos } from "./tipos";
import { ControlInhabilitado } from "./ControlInhabilitado";
import { ETIQUETA_MUESTRA, evaluarRendimiento, fraseCpa, geometriaBarra, textoMuestra, type Rendimiento } from "./semaforo";
import { HUNDIDO, NOTA, PANEL, TITULO_PANEL } from "./estilos";
import { cn } from "@/lib/utils";

export interface SemaforoEconomicoProps {
  cpa: Cifra;
  conversiones: number | null;
  supuestos: SupuestosEconomicos;
  /** "panel": tarjeta completa (escritorio). "barra": solo la barra con el marcador (dentro de la tarjeta del CPA en movil). */
  variante?: "panel" | "barra";
  /** En el panel: no repetir la barra (en movil ya va dentro de la tarjeta del CPA). */
  sinBarra?: boolean;
  className?: string;
}

/** Rendimiento de este CPA, o null si el CPA o los supuestos no permiten emitir juicio (sin CPA valido, sin fuente o fecha de supuestos). */
export function rendimientoDe(cpa: Cifra, conversiones: number | null, supuestos: SupuestosEconomicos): Rendimiento | null {
  const estadoSup = !supuestos.fuente || !supuestos.fecha_dato || formatearFecha(supuestos.fecha_dato) === null ? "pendiente_integracion" : "ok";
  if (estadoEfectivo(cpa) !== "ok" || estadoSup !== "ok") return null;
  const r = evaluarRendimiento({ cpa: cpa.valor, objetivo: supuestos.objetivo, equilibrio: supuestos.equilibrio, conversiones, cierresCrm: supuestos.cierres_crm });
  return r.lectura === "datos_insuficientes" ? null : r;
}

const TEXTO = {
  bajo_objetivo: { tono: "kit-txt-ok", Icono: Check, borde: "border-[color:var(--kit-ok)]" },
  entre_objetivo_equilibrio: { tono: "kit-txt-atencion", Icono: AlertTriangle, borde: "border-[color:var(--kit-atencion)]" },
  sobre_equilibrio: { tono: "kit-txt-error", Icono: XCircle, borde: "border-[color:var(--kit-error)]" },
} as const;

/** Texto de la rentabilidad: SIEMPRE «sin confirmar» (o «en revision» si ya hay cierres CRM); nunca «confirmada» ni «rentable». */
export function textoRentabilidad(cierres: number | null, rentabilidad: Rendimiento["rentabilidad"]): string {
  const estado = rentabilidad === "en_revision" ? "en revisión" : "sin confirmar";
  const crm = cierres === null ? "cierres CRM pendientes" : `${cierres} ${cierres === 1 ? "cierre" : "cierres"} CRM`;
  return `Rentabilidad: ${estado} · ${crm}`;
}

/** Linea de la rentabilidad junto al CPA (escritorio y tarjeta completa). */
export function AvisoRentabilidad({ cierres, rentabilidad, className }: { cierres: number | null; rentabilidad: Rendimiento["rentabilidad"]; className?: string }) {
  return (
    <p data-testid="cpa-rentabilidad" className={cn("m-0 text-[12px] font-medium kit-txt-2", className)}>
      {textoRentabilidad(cierres, rentabilidad)}
    </p>
  );
}

/** Texto de los supuestos financieros. `breve`: solo objetivo y equilibrio (el detalle completo vive en el panel de supuestos). */
export function textoSupuestos(supuestos: SupuestosEconomicos, formato: Parameters<typeof formatearValor>[1], breve = false): string {
  const usd = (n: number | null) => formatearValor({ valor: n, unidad: "moneda", moneda: supuestos.moneda }, formato);
  const base = `Objetivo ${usd(supuestos.objetivo)} · equilibrio ${usd(supuestos.equilibrio)}`;
  if (breve) return base;
  const cierre = supuestos.tasa_cierre === null ? "—" : formatearPorcentaje(supuestos.tasa_cierre * 100, 0, formato);
  return `${base} · comisión ${usd(supuestos.comision)} · cierre ${cierre}`;
}

/** Resumen de una linea de los supuestos financieros: siempre visible junto al semaforo. */
export function ResumenSupuestos({ supuestos, className }: { supuestos: SupuestosEconomicos; className?: string }) {
  const formato = useFormato();
  return (
    <p data-testid="resumen-supuestos" className={cn("m-0 text-[12px] kit-txt-2", className)}>
      {textoSupuestos(supuestos, formato)}
    </p>
  );
}

/**
 * Aviso minimo de movil: la ausencia de cierres CRM y los supuestos (objetivo y equilibrio) en UN bloque compacto,
 * siempre visible bajo los tres indicadores. El detalle (comision, tasa de cierre, fuente) esta en «Supuestos financieros y fuentes».
 */
export function AvisoMinimo({ supuestos, cierres, rentabilidad, className }: { supuestos: SupuestosEconomicos; cierres: number | null; rentabilidad: Rendimiento["rentabilidad"]; className?: string }) {
  const formato = useFormato();
  return (
    <p data-testid="aviso-minimo" className={cn("m-0 border-t kit-bd-suave pt-1.5 text-[11px] font-medium leading-snug kit-txt-2", className)}>
      <span data-testid="cpa-rentabilidad">{textoRentabilidad(cierres, rentabilidad)}</span>
      <span aria-hidden> · </span>
      <span data-testid="resumen-supuestos">{textoSupuestos(supuestos, formato, true)}</span>
    </p>
  );
}

export interface FuenteCifra {
  etiqueta: string;
  fuente: string | null;
  fecha_dato: string | null;
}

/**
 * Fuente y fecha agrupadas (movil): las tarjetas compactas no repiten su fuente; esta linea cubre cada cifra por su nombre.
 * Cifras con la misma fuente y fecha comparten linea; si difieren, cada fuente consta aparte.
 */
export function FuentesResumen({ cifras, className }: { cifras: FuenteCifra[]; className?: string }) {
  const formato = useFormato();
  const grupos = new Map<string, { fuente: string; fecha: string; etiquetas: string[] }>();
  for (const c of cifras) {
    const fuente = c.fuente ?? "sin fuente";
    const fecha = formatearFecha(c.fecha_dato, formato) ?? "sin fecha";
    const clave = `${fuente}|${fecha}`;
    const g = grupos.get(clave) ?? { fuente, fecha, etiquetas: [] };
    g.etiquetas.push(c.etiqueta);
    grupos.set(clave, g);
  }
  return (
    <div data-testid="fuentes-resumen" className={cn("flex flex-col gap-0.5", NOTA, className)}>
      {Array.from(grupos.values()).map((g) => (
        <p key={`${g.fuente}|${g.fecha}`} className="m-0">
          <span>Fuente: {g.fuente}</span>
          <span aria-hidden> · </span>
          <span>Dato al {g.fecha}</span>
          <span>{` (${g.etiquetas.join(", ")})`}</span>
        </p>
      ))}
    </div>
  );
}

export function SemaforoEconomico({ cpa, conversiones, supuestos, variante = "panel", sinBarra = false, className }: SemaforoEconomicoProps) {
  const formato = useFormato();
  const usd = (n: number | null) => formatearValor({ valor: n, unidad: "moneda", moneda: supuestos.moneda }, formato);
  const estadoCpa = estadoEfectivo(cpa);
  const estadoSup = !supuestos.fuente || !supuestos.fecha_dato || formatearFecha(supuestos.fecha_dato) === null ? "pendiente_integracion" : "ok";
  const r = rendimientoDe(cpa, conversiones, supuestos);
  const lectura = r?.lectura ?? "datos_insuficientes";
  const geo = r ? geometriaBarra(cpa.valor, supuestos.objetivo, supuestos.equilibrio) : null;
  const cfg = r && lectura !== "datos_insuficientes" ? TEXTO[lectura] : null;
  const rango = supuestos.rango_probable;

  // «Datos muy limitados» (menos de 5 conversiones): sin juicio frente al objetivo, por tanto sin marcador sobre la barra.
  const barra = geo && r?.muestra !== "muy_limitada" ? (
    <div>
      <div
        role="img"
        aria-label={`CPA ${usd(cpa.valor)} frente a objetivo ${usd(supuestos.objetivo)} y equilibrio ${usd(supuestos.equilibrio)}`}
        className="kit-bg-hundida-2 relative h-3 w-full overflow-hidden rounded-full"
        data-testid="semaforo-barra"
      >
        <span className="absolute inset-y-0 left-0 bg-[color:var(--kit-ok)] opacity-70" style={{ width: `${geo.objetivoPct}%` }} />
        <span className="absolute inset-y-0 bg-[color:var(--kit-atencion)] opacity-70" style={{ left: `${geo.objetivoPct}%`, width: `${geo.equilibrioPct - geo.objetivoPct}%` }} />
        <span className="kit-bg-error absolute inset-y-0 right-0 opacity-70" style={{ left: `${geo.equilibrioPct}%` }} />
        <span
          data-testid="semaforo-marcador"
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-[color:var(--kit-superficie)] bg-[color:var(--kit-texto)]"
          style={{ left: `${geo.marcadorPct}%` }}
        />
      </div>
      <div className="mt-1 flex justify-between gap-2 text-[11px] kit-txt-3">
        <span>{usd(0)}</span>
        <span>{`${usd(supuestos.objetivo)} objetivo`}</span>
        <span>{`${usd(supuestos.equilibrio)} equilibrio`}</span>
      </div>
    </div>
  ) : null;

  if (variante === "barra") return barra ? <div className={className}>{barra}</div> : null;

  return (
    <section aria-labelledby="semaforo-t" className={cn(PANEL, "flex flex-col gap-4 p-5", className)} data-testid="semaforo">
      <h3 id="semaforo-t" className={TITULO_PANEL}>
        Semáforo económico
      </h3>

      {!cfg || !r ? (
        <EstadoAnalitica
          estado={estadoSup === "pendiente_integracion" || estadoCpa === "pendiente_integracion" ? "pendiente_integracion" : "datos_insuficientes"}
          compacto
          descripcion="Sin CPA, objetivo o equilibrio válidos no se emite un juicio económico."
        />
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className={cn("kit-bg-hundida flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2", r.preliminar ? "kit-bd-control" : cfg.borde, r.preliminar ? "kit-txt-acento" : cfg.tono)}>
              {r.preliminar ? <CircleDashed className="h-6 w-6" aria-hidden /> : <cfg.Icono className="h-6 w-6" aria-hidden />}
            </span>
            <div className="min-w-0">
              <p className="m-0 text-[16px] font-semibold kit-txt" data-testid="semaforo-lectura">
                {ETIQUETA_MUESTRA[r.muestra]}
              </p>
              <p className="m-0 text-[12px] kit-txt-2">
                {`${fraseCpa(lectura, r.muestra)} · ${textoMuestra(conversiones)}`}
                {rango ? ` · rango probable ${usd(rango.min)}–${usd(rango.max)}` : ""}
              </p>
            </div>
          </div>
          {sinBarra ? null : barra}
        </>
      )}

      <dl className={cn(HUNDIDO, "m-0 flex flex-col gap-2 p-3 text-[12px] kit-txt-2")}>
        <Fila k="CPA observado" v={estadoCpa === "ok" ? usd(cpa.valor) : "—"} />
        <Fila k="CPA objetivo (configurable)" v={usd(supuestos.objetivo)} />
        <Fila
          k={`Equilibrio (comisión ${usd(supuestos.comision)} · cierre ${supuestos.tasa_cierre === null ? "—" : formatearPorcentaje(supuestos.tasa_cierre * 100, 0, formato)})`}
          v={usd(supuestos.equilibrio)}
        />
        <Fila k="Rentabilidad real" v={supuestos.cierres_crm === null ? "Pendiente CRM" : `${supuestos.cierres_crm} cierres CRM · en revisión`} apagado />
      </dl>
      <p className="m-0 text-[12px] kit-txt-2">Un CPA bajo el objetivo no prueba rentabilidad: falta confirmar cierres reales.</p>
      {supuestos.fuente && supuestos.fecha_dato ? <p className={cn("m-0", NOTA)}>{`Fuente de los supuestos: ${supuestos.fuente} · dato al ${formatearFecha(supuestos.fecha_dato, formato)}`}</p> : null}

      <ControlInhabilitado disponibleCuando="exista el modelo económico editable (B2-T1) y el flujo de aprobación" visible>
        Cambiar supuestos · requiere aprobación
      </ControlInhabilitado>
    </section>
  );
}

function Fila({ k, v, apagado }: { k: string; v: string; apagado?: boolean }) {
  return (
    <div className="flex min-w-0 justify-between gap-3">
      <dt className="min-w-0">{k}</dt>
      <dd className={cn("m-0 shrink-0 font-semibold tabular-nums", apagado ? "kit-txt-2" : "kit-txt")}>{v}</dd>
    </div>
  );
}
