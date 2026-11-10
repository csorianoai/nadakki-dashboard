"use client";

import { useFormato } from "@/components/analytics/kit";
import { calcularVariacion, estadoEfectivo, formatearFecha, formatearPorcentaje, formatearValor, type Cifra } from "@/lib/analytics/cifra";
import { cn } from "@/lib/utils";
import { NOTA, PANEL } from "./estilos";

/**
 * Indicadores secundarios (clics, CPC, impresiones, CTR, conversiones) en un solo panel con una linea de fuente comun.
 * Cada indicador conserva su propia fuente y fecha para tecnologias de asistencia; si alguno no la tiene o no tiene valor,
 * se pinta como estado (nunca como dato). Sin NaN/Infinity: la variacion sale de calcularVariacion.
 */
export function IndicadoresSecundarios({ cifras, className }: { cifras: Cifra[]; className?: string }) {
  const formato = useFormato();
  const validas = cifras.filter((c) => estadoEfectivo(c) === "ok");
  const fuentes = Array.from(new Set(validas.map((c) => `${c.fuente} · dato al ${formatearFecha(c.fecha_dato, formato)}`)));

  return (
    <section aria-label="Indicadores secundarios" className={cn(PANEL, className)}>
      <dl className="m-0 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
        {cifras.map((c) => {
          const estado = estadoEfectivo(c);
          const v = calcularVariacion(c.valor, c.valor_anterior);
          const mejorSi = c.mejor_si ?? "sube";
          const sentido = v.estado === "ok" && v.direccion !== "neutral" ? ((v.direccion === "up") === (mejorSi === "sube") ? "mejor" : "peor") : "igual";
          const color = sentido === "mejor" ? "kit-txt-ok" : sentido === "peor" ? "kit-txt-error" : "kit-txt-3";
          const signo = v.estado === "ok" ? (v.porcentaje > 0 ? "+" : v.porcentaje < 0 ? "−" : "") : "";
          return (
            <div key={c.id} data-testid={`secundaria-${c.id}`} className="flex min-w-0 flex-col gap-1 border-b border-r kit-bd-suave p-4 lg:border-b-0">
              <dt className="text-[12px] kit-txt-3">{c.etiqueta}</dt>
              {estado === "ok" ? (
                <dd className="m-0 flex min-w-0 flex-wrap items-baseline gap-x-2">
                  <span className="break-words font-display text-[20px] font-bold leading-tight tabular-nums kit-txt">{formatearValor(c, formato)}</span>
                  {v.estado === "ok" ? (
                    <span data-sentido={sentido} className={cn("text-[12px] font-medium tabular-nums", color)}>
                      {`${signo}${formatearPorcentaje(Math.abs(v.porcentaje), 1, formato)}`}
                      <span className="sr-only"> vs periodo anterior</span>
                    </span>
                  ) : (
                    <span className="text-[12px] kit-txt-3">Sin comparación</span>
                  )}
                  <span className="sr-only">{`Fuente: ${c.fuente}, dato al ${formatearFecha(c.fecha_dato, formato)}`}</span>
                </dd>
              ) : (
                <dd data-estado={estado} className="m-0 text-[12px] kit-txt-3">
                  {estado === "pendiente_integracion" ? "Pendiente de integración" : estado === "datos_insuficientes" ? "Datos insuficientes" : estado === "cargando" ? "Cargando" : estado === "error" ? "Error al cargar" : "Sin datos"}
                </dd>
              )}
            </div>
          );
        })}
      </dl>
      {fuentes.length > 0 ? (
        <p className={cn("m-0 border-t px-4 py-2 kit-bd-suave", NOTA)}>
          <span>Fuente: {fuentes.join(" | ")}</span>
          <span> · variación vs periodo anterior</span>
        </p>
      ) : null}
    </section>
  );
}
