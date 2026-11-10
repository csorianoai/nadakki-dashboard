"use client";

import { calcularVariacion, estadoEfectivo, formatearFecha, formatearPorcentaje, formatearValor, type Cifra } from "@/lib/analytics/cifra";
import { cn } from "@/lib/utils";

/**
 * Indicadores secundarios (clics, CPC, impresiones, CTR, conversiones) en un solo panel con una linea de fuente comun.
 * Cada indicador conserva su propia fuente y fecha para tecnologias de asistencia; si alguno no la tiene o no tiene valor,
 * se pinta como estado (nunca como dato). Sin NaN/Infinity: la variacion sale de calcularVariacion.
 */
export function IndicadoresSecundarios({ cifras, className }: { cifras: Cifra[]; className?: string }) {
  const validas = cifras.filter((c) => estadoEfectivo(c) === "ok");
  const fuentes = Array.from(new Set(validas.map((c) => `${c.fuente} · dato al ${formatearFecha(c.fecha_dato)}`)));

  return (
    <section aria-label="Indicadores secundarios" className={cn("min-w-0 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card", className)}>
      <dl className="m-0 grid grid-cols-2 divide-x divide-y divide-forgeGray-200 sm:grid-cols-3 lg:grid-cols-5 lg:divide-y-0">
        {cifras.map((c) => {
          const estado = estadoEfectivo(c);
          const v = calcularVariacion(c.valor, c.valor_anterior);
          const mejorSi = c.mejor_si ?? "sube";
          const sentido = v.estado === "ok" && v.direccion !== "neutral" ? ((v.direccion === "up") === (mejorSi === "sube") ? "mejor" : "peor") : "igual";
          const color = sentido === "mejor" ? "text-forgeSuccess-700" : sentido === "peor" ? "text-forgeDanger-700" : "text-forgeGray-600";
          const signo = v.estado === "ok" ? (v.porcentaje > 0 ? "+" : v.porcentaje < 0 ? "−" : "") : "";
          return (
            <div key={c.id} data-testid={`secundaria-${c.id}`} className="flex min-w-0 flex-col gap-1 p-4">
              <dt className="text-forge-xs text-forgeGray-600">{c.etiqueta}</dt>
              {estado === "ok" ? (
                <dd className="m-0 flex min-w-0 flex-wrap items-baseline gap-x-2">
                  <span className="break-words font-display text-[20px] font-bold leading-tight tabular-nums text-forgeGray-900">{formatearValor(c)}</span>
                  {v.estado === "ok" ? (
                    <span data-sentido={sentido} className={cn("text-forge-xs font-medium tabular-nums", color)}>
                      {`${signo}${formatearPorcentaje(Math.abs(v.porcentaje), 1)}`}
                      <span className="sr-only"> vs periodo anterior</span>
                    </span>
                  ) : (
                    <span className="text-forge-xs text-forgeGray-600">Sin comparación</span>
                  )}
                  <span className="sr-only">{`Fuente: ${c.fuente}, dato al ${formatearFecha(c.fecha_dato)}`}</span>
                </dd>
              ) : (
                <dd data-estado={estado} className="m-0 text-forge-xs text-forgeGray-600">
                  {estado === "pendiente_integracion" ? "Pendiente de integración" : estado === "datos_insuficientes" ? "Datos insuficientes" : estado === "cargando" ? "Cargando" : estado === "error" ? "Error al cargar" : "Sin datos"}
                </dd>
              )}
            </div>
          );
        })}
      </dl>
      {fuentes.length > 0 ? (
        <p className="m-0 border-t border-forgeGray-200 px-4 py-2 text-forge-xs text-forgeGray-600">
          <span>Fuente: {fuentes.join(" | ")}</span>
          <span> · variación vs periodo anterior</span>
        </p>
      ) : null}
    </section>
  );
}
