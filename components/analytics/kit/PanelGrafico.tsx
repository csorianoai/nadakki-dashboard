"use client";

import { useId, type ReactNode } from "react";
import { EstadoAnalitica, type EstadoNoOk } from "./EstadoAnalitica";
import { formatearFecha, type EstadoCifra } from "@/lib/analytics/cifra";
import type { MetaGrafico } from "@/lib/analytics/graficos";
import { cn } from "@/lib/utils";

export interface TablaAlternativa {
  columnas: string[];
  filas: string[][];
}

export interface PanelGraficoProps {
  meta: MetaGrafico;
  /** Estado efectivo ya resuelto por el grafico (ver estadoGrafico). */
  estado: EstadoCifra;
  /** Alternativa en tabla para lectores de pantalla y para quien no distingue colores. */
  tabla?: TablaAlternativa;
  onReintentar?: () => void;
  /** Aviso corto bajo el grafico (p. ej. "Mostrando 10 de 15"). */
  nota?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Marco comun de los graficos de analitica: titulo, estados, fuente + fecha del dato bajo el grafico
 * y tabla de datos desplegable. Los graficos no se pintan si el estado no es "ok".
 */
export function PanelGrafico({ meta, estado, tabla, onReintentar, nota, children, className }: PanelGraficoProps) {
  const id = useId();
  const fecha = formatearFecha(meta.fecha_dato);
  return (
    <figure aria-labelledby={`${id}-t`} className={cn("m-0 min-w-0 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-card p-4", className)}>
      <figcaption id={`${id}-t`} className="text-forge-sm font-semibold text-forgeGray-800">
        {meta.titulo}
      </figcaption>
      {meta.descripcion ? <p className="mt-1 text-forge-xs text-forgeGray-600">{meta.descripcion}</p> : null}
      {estado !== "ok" ? (
        <div className="mt-3">
          <EstadoAnalitica estado={estado as EstadoNoOk} descripcion={meta.mensaje} onReintentar={onReintentar} />
        </div>
      ) : (
        <>
          <div className="mt-3 min-w-0">{children}</div>
          {nota ? <p className="mt-2 text-forge-xs text-forgeGray-600">{nota}</p> : null}
          <p className="mt-3 text-forge-xs text-forgeGray-500">
            <span>Fuente: {meta.fuente}</span>
            <span aria-hidden> · </span>
            <span>Dato al {fecha}</span>
          </p>
          {tabla ? (
            <details className="mt-3">
              <summary className="min-h-[44px] cursor-pointer py-3 text-forge-xs font-medium text-forgeBrand-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-600">
                Ver tabla de datos
              </summary>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-forge-xs text-forgeGray-700">
                  <caption className="sr-only">{`${meta.titulo} (tabla de datos)`}</caption>
                  <thead>
                    <tr>
                      {tabla.columnas.map((c) => (
                        <th key={c} scope="col" className="border-b border-forgeGray-200 px-2 py-1 font-medium text-forgeGray-800">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tabla.filas.map((f, i) => (
                      <tr key={i}>
                        {f.map((celda, j) =>
                          j === 0 ? (
                            <th key={j} scope="row" className="border-b border-forgeGray-100 px-2 py-1 font-normal">
                              {celda}
                            </th>
                          ) : (
                            <td key={j} className="border-b border-forgeGray-100 px-2 py-1 tabular-nums">
                              {celda}
                            </td>
                          )
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          ) : null}
        </>
      )}
    </figure>
  );
}
