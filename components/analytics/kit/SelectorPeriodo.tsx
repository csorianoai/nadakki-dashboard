"use client";

import "./tema.css";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { OPCIONES_PERIODO, periodoDeTipo, rangoValido, type TipoPeriodo } from "@/lib/analytics/periodo";
import type { PeriodoAnalitica } from "@/lib/analytics/cifra";
import { cn } from "@/lib/utils";

export interface SelectorPeriodoProps {
  valor: PeriodoAnalitica;
  onChange: (periodo: PeriodoAnalitica) => void;
  className?: string;
}

const FOCO =
  "kit-foco";

/** Selector de periodo accesible: radiogroup con roving tabindex y flechas; el rango personalizado se valida antes de emitir. */
export function SelectorPeriodo({ valor, onChange, className }: SelectorPeriodoProps) {
  const id = useId();
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const [borrador, setBorrador] = useState<{ desde: string; hasta: string }>(
    valor.tipo === "personalizado" ? { desde: valor.desde, hasta: valor.hasta } : { desde: "", hasta: "" }
  );
  const [errorRango, setErrorRango] = useState<string | null>(null);

  const indiceActivo = OPCIONES_PERIODO.findIndex((o) => o.tipo === valor.tipo);

  function elegir(tipo: TipoPeriodo) {
    setErrorRango(null);
    onChange(periodoDeTipo(tipo, valor));
  }

  function alTeclear(e: KeyboardEvent<HTMLButtonElement>, i: number) {
    const n = OPCIONES_PERIODO.length;
    let destino = -1;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") destino = (i + 1) % n;
    else if (e.key === "ArrowLeft" || e.key === "ArrowUp") destino = (i - 1 + n) % n;
    else if (e.key === "Home") destino = 0;
    else if (e.key === "End") destino = n - 1;
    if (destino < 0) return;
    e.preventDefault();
    elegir(OPCIONES_PERIODO[destino].tipo);
    refs.current[destino]?.focus();
  }

  function alCambiarFecha(campo: "desde" | "hasta", v: string) {
    const siguiente = { ...borrador, [campo]: v };
    setBorrador(siguiente);
    if (!siguiente.desde || !siguiente.hasta) {
      setErrorRango(null);
      return;
    }
    if (!rangoValido(siguiente.desde, siguiente.hasta)) {
      setErrorRango("La fecha «Desde» debe ser anterior o igual a «Hasta».");
      return;
    }
    setErrorRango(null);
    onChange({ tipo: "personalizado", desde: siguiente.desde, hasta: siguiente.hasta });
  }

  const campo =
    "min-h-[44px] w-full min-w-0 rounded-forge-sm border kit-ctl px-3 text-forge-sm " + FOCO;

  return (
    <div className={cn("min-w-0", className)}>
      <div role="radiogroup" aria-label="Periodo" className="flex flex-wrap gap-2">
        {OPCIONES_PERIODO.map((o, i) => {
          const activo = i === indiceActivo;
          return (
            <button
              key={o.tipo}
              ref={(el) => {
                refs.current[i] = el;
              }}
              type="button"
              role="radio"
              aria-checked={activo}
              tabIndex={activo ? 0 : -1}
              onClick={() => elegir(o.tipo)}
              onKeyDown={(e) => alTeclear(e, i)}
              className={cn(
                "min-h-[44px] min-w-0 rounded-forge-sm border px-3 text-forge-sm font-medium",
                activo ? "kit-ctl-activo" : "kit-ctl",
                FOCO
              )}
            >
              {o.etiqueta}
            </button>
          );
        })}
      </div>
      {valor.tipo === "personalizado" ? (
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="min-w-0">
            <label htmlFor={`${id}-desde`} className="mb-1 block text-forge-xs font-medium kit-txt-2">
              Desde
            </label>
            <input id={`${id}-desde`} type="date" value={borrador.desde} onChange={(e) => alCambiarFecha("desde", e.target.value)} className={campo} />
          </div>
          <div className="min-w-0">
            <label htmlFor={`${id}-hasta`} className="mb-1 block text-forge-xs font-medium kit-txt-2">
              Hasta
            </label>
            <input id={`${id}-hasta`} type="date" value={borrador.hasta} onChange={(e) => alCambiarFecha("hasta", e.target.value)} className={campo} />
          </div>
          {errorRango ? (
            <p role="alert" className="text-forge-xs kit-txt-error sm:col-span-2">
              {errorRango}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
