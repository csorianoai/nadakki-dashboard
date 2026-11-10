"use client";

import { Check, AlertTriangle, XCircle } from "lucide-react";
import { EstadoAnalitica } from "@/components/analytics/kit";
import { estadoEfectivo, formatearFecha, formatearPorcentaje, formatearValor, type Cifra } from "@/lib/analytics/cifra";
import type { SupuestosEconomicos } from "./tipos";
import { ControlInhabilitado } from "./ControlInhabilitado";
import { clasificarCpa, geometriaBarra, muestraPequena } from "./semaforo";
import { cn } from "@/lib/utils";

export interface SemaforoEconomicoProps {
  cpa: Cifra;
  conversiones: number | null;
  supuestos: SupuestosEconomicos;
  className?: string;
}

const TEXTO = {
  bajo_objetivo: { titulo: "Bajo el CPA objetivo", tono: "text-forgeSuccess-700", Icono: Check, borde: "border-forgeSuccess-500" },
  entre_objetivo_equilibrio: { titulo: "Entre el objetivo y el equilibrio", tono: "text-forgeWarning-700", Icono: AlertTriangle, borde: "border-forgeWarning-500" },
  sobre_equilibrio: { titulo: "Sobre el equilibrio", tono: "text-forgeDanger-700", Icono: XCircle, borde: "border-forgeDanger-500" },
} as const;

export function SemaforoEconomico({ cpa, conversiones, supuestos, className }: SemaforoEconomicoProps) {
  const moneda = supuestos.moneda;
  const usd = (n: number | null) => formatearValor({ valor: n, unidad: "moneda", moneda });
  const estadoCpa = estadoEfectivo(cpa);
  const estadoSup = !supuestos.fuente || !supuestos.fecha_dato || formatearFecha(supuestos.fecha_dato) === null ? "pendiente_integracion" : "ok";
  const lectura = estadoCpa === "ok" && estadoSup === "ok" ? clasificarCpa(cpa.valor, supuestos.objetivo, supuestos.equilibrio) : "datos_insuficientes";
  const geo = lectura === "datos_insuficientes" ? null : geometriaBarra(cpa.valor, supuestos.objetivo, supuestos.equilibrio);
  const cfg = lectura === "datos_insuficientes" ? null : TEXTO[lectura];
  const rango = supuestos.rango_probable;

  return (
    <section aria-labelledby="semaforo-t" className={cn("flex min-w-0 flex-col gap-4 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-4", className)} data-testid="semaforo">
      <h3 id="semaforo-t" className="m-0 font-display text-forge-base font-semibold text-forgeGray-800">
        Semáforo económico
      </h3>

      {!cfg || !geo ? (
        <EstadoAnalitica
          estado={estadoSup === "pendiente_integracion" || estadoCpa === "pendiente_integracion" ? "pendiente_integracion" : "datos_insuficientes"}
          compacto
          descripcion="Sin CPA, objetivo o equilibrio válidos no se emite un juicio económico."
        />
      ) : (
        <>
          <div className="flex items-center gap-3">
            <span className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 bg-forgeSurface-sunken", cfg.borde, cfg.tono)}>
              <cfg.Icono className="h-6 w-6" aria-hidden />
            </span>
            <div className="min-w-0">
              <p className={cn("m-0 text-forge-base font-semibold", cfg.tono)} data-testid="semaforo-lectura">
                {cfg.titulo}
              </p>
              <p className="m-0 text-forge-xs text-forgeGray-700">
                {`${conversiones ?? "—"} conversiones`}
                {muestraPequena(conversiones) ? " · muestra pequeña" : ""}
                {rango ? ` · rango probable ${usd(rango.min)}–${usd(rango.max)}` : ""}
              </p>
            </div>
          </div>

          <div>
            <div
              role="img"
              aria-label={`CPA ${usd(cpa.valor)} frente a objetivo ${usd(supuestos.objetivo)} y equilibrio ${usd(supuestos.equilibrio)}`}
              className="relative h-3 w-full overflow-hidden rounded-full bg-forgeGray-100"
              data-testid="semaforo-barra"
            >
              <span className="absolute inset-y-0 left-0 bg-forgeSuccess-500" style={{ width: `${geo.objetivoPct}%` }} />
              <span className="absolute inset-y-0 bg-forgeWarning-500" style={{ left: `${geo.objetivoPct}%`, width: `${geo.equilibrioPct - geo.objetivoPct}%` }} />
              <span className="absolute inset-y-0 right-0 bg-forgeDanger-500" style={{ left: `${geo.equilibrioPct}%` }} />
              <span
                data-testid="semaforo-marcador"
                className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-forgeSurface-card bg-forgeGray-900"
                style={{ left: `${geo.marcadorPct}%` }}
              />
            </div>
            <div className="mt-1 flex justify-between gap-2 text-forge-xs text-forgeGray-700">
              <span>{usd(0)}</span>
              <span>{`${usd(supuestos.objetivo)} objetivo`}</span>
              <span>{`${usd(supuestos.equilibrio)} equilibrio`}</span>
            </div>
          </div>
        </>
      )}

      <dl className="m-0 flex flex-col gap-2 rounded-forge-sm bg-forgeSurface-sunken p-3 text-forge-xs text-forgeGray-800">
        <Fila k="CPA observado" v={estadoCpa === "ok" ? usd(cpa.valor) : "—"} />
        <Fila k="CPA objetivo (configurable)" v={usd(supuestos.objetivo)} />
        <Fila
          k={`Equilibrio (comisión ${usd(supuestos.comision)} · cierre ${supuestos.tasa_cierre === null ? "—" : formatearPorcentaje(supuestos.tasa_cierre * 100, 0)})`}
          v={usd(supuestos.equilibrio)}
        />
        <Fila k="Rentabilidad real" v="Pendiente CRM" apagado />
      </dl>
      <p className="m-0 text-forge-xs text-forgeGray-700">Un CPA bajo el objetivo no prueba rentabilidad: falta confirmar cierres reales.</p>
      {supuestos.fuente && supuestos.fecha_dato ? (
        <p className="m-0 text-forge-xs text-forgeGray-600">{`Fuente de los supuestos: ${supuestos.fuente} · dato al ${formatearFecha(supuestos.fecha_dato)}`}</p>
      ) : null}

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
      <dd className={cn("m-0 shrink-0 font-semibold tabular-nums", apagado ? "text-forgeGray-700" : "text-forgeGray-900")}>{v}</dd>
    </div>
  );
}
