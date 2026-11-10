"use client";

import { useRef } from "react";
import { PanelGrafico } from "./PanelGrafico";
import { useAncho } from "./useAncho";
import { formatearValor, type UnidadCifra } from "@/lib/analytics/cifra";
import { escalar, esFinito, estadoGrafico, etiquetaCorta, margenIzquierdo, redondear, rutaLinea, ticksLineales, type MetaGrafico, type PuntoSerie } from "@/lib/analytics/graficos";

export interface SerieTemporalProps {
  meta: MetaGrafico;
  datos: { actual: PuntoSerie[]; /** Periodo anterior del mismo largo, alineado por posicion. */ anterior?: PuntoSerie[] };
  unidad: UnidadCifra;
  moneda?: string;
  /** Ancho inicial en px (SSR, capturas); en el navegador se mide el contenedor. */
  ancho?: number;
  onReintentar?: () => void;
  className?: string;
}


/** Serie temporal en SVG propio (sin dependencias): linea del periodo actual y, opcional, el anterior en trazo discontinuo. */
export function SerieTemporal({ meta, datos, unidad, moneda, ancho: anchoInicial = 560, onReintentar, className }: SerieTemporalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const ancho = Math.max(240, useAncho(ref, anchoInicial));
  const alto = Math.round(Math.min(320, Math.max(180, ancho * 0.45)));

  const validos = datos.actual.filter((p) => esFinito(p.y)).length;
  const estado = estadoGrafico(meta, validos);
  const fmt = (v: number | null) => formatearValor({ valor: v, unidad, moneda });

  const anterior = datos.anterior ?? [];
  const n = Math.max(datos.actual.length, anterior.length);
  const todos = [...datos.actual, ...anterior].map((p) => p.y).filter(esFinito);
  const ticks = todos.length ? ticksLineales(Math.min(0, ...todos), Math.max(0, ...todos), 4) : [0, 1];
  const dom: [number, number] = [ticks[0], ticks[ticks.length - 1]];
  const M = { izq: margenIzquierdo(ticks.map(fmt)), der: 14, arr: 12, aba: 28 };
  const plotW = ancho - M.izq - M.der;
  const plotH = alto - M.arr - M.aba;
  const px = (i: number) => (n <= 1 ? M.izq + plotW / 2 : M.izq + (i / (n - 1)) * plotW);
  const py = (v: number) => redondear(escalar(v, dom, [M.arr + plotH, M.arr]));
  const aPuntos = (serie: PuntoSerie[]) => serie.map((p, i) => (esFinito(p.y) ? { x: redondear(px(i)), y: py(p.y) } : null));

  const dActual = rutaLinea(aPuntos(datos.actual));
  const dAnterior = anterior.length ? rutaLinea(aPuntos(anterior)) : "";
  const maxV = todos.length ? Math.max(...todos) : 0;
  const minV = todos.length ? Math.min(...todos) : 0;
  const idxEtiquetas = n <= 1 ? [0] : Array.from(new Set([0, Math.floor((n - 1) / 2), n - 1]));
  const resumen = `Serie temporal: ${meta.titulo}. ${validos} ${validos === 1 ? "punto" : "puntos"}, de ${fmt(minV)} a ${fmt(maxV)}.`;

  const tabla = {
    columnas: ["Fecha", "Valor del periodo actual", ...(anterior.length ? ["Valor del periodo anterior"] : [])],
    filas: Array.from({ length: n }, (_, i) => [
      datos.actual[i] ? etiquetaCorta(datos.actual[i].x) : "—",
      fmt(datos.actual[i]?.y ?? null),
      ...(anterior.length ? [fmt(anterior[i]?.y ?? null)] : []),
    ]),
  };

  return (
    <PanelGrafico
      meta={meta}
      estado={estado}
      tabla={tabla}
      onReintentar={onReintentar}
      className={className}
      nota={validos === 1 ? "Un solo punto en el periodo: todavía no hay tendencia que mostrar." : undefined}
    >
      <div ref={ref} className="min-w-0">
        {anterior.length ? (
          <ul className="mb-2 flex flex-wrap gap-x-4 gap-y-1 text-forge-xs text-forgeGray-700" aria-label="Leyenda de la serie">
            <li className="flex items-center gap-2">
              <svg width="24" height="8" aria-hidden>
                <line x1="0" y1="4" x2="24" y2="4" className="stroke-forgeViz-1" strokeWidth="2" />
              </svg>
              <span>Periodo actual</span>
            </li>
            <li className="flex items-center gap-2">
              <svg width="24" height="8" aria-hidden>
                <line x1="0" y1="4" x2="24" y2="4" className="stroke-forgeGray-500" strokeWidth="2" strokeDasharray="4 3" />
              </svg>
              <span>Periodo anterior</span>
            </li>
          </ul>
        ) : null}
        <svg role="img" aria-label={resumen} viewBox={`0 0 ${ancho} ${alto}`} className="block h-auto w-full" preserveAspectRatio="xMidYMid meet">
          {ticks.map((t) => (
            <g key={t}>
              <line x1={M.izq} x2={ancho - M.der} y1={py(t)} y2={py(t)} className={t === 0 ? "stroke-forgeGray-400" : "stroke-forgeGray-200"} strokeWidth="1" {...(t === 0 ? { "data-cero": "" } : {})} />
              <text x={M.izq - 6} y={py(t)} textAnchor="end" dominantBaseline="middle" className="fill-forgeGray-600 text-[11px]">
                {fmt(t)}
              </text>
            </g>
          ))}
          {idxEtiquetas.map((i, k) => (
            <text key={i} x={px(i)} y={alto - 8} textAnchor={k === 0 && idxEtiquetas.length > 1 ? "start" : k === idxEtiquetas.length - 1 && idxEtiquetas.length > 1 ? "end" : "middle"} className="fill-forgeGray-600 text-[11px]">
              {datos.actual[i] ? etiquetaCorta(datos.actual[i].x) : ""}
            </text>
          ))}
          {dAnterior ? <path data-serie="anterior" d={dAnterior} fill="none" className="stroke-forgeGray-500" strokeWidth="2" strokeDasharray="4 3" strokeLinejoin="round" strokeLinecap="round" /> : null}
          {dActual ? <path data-serie="actual" d={dActual} fill="none" className="stroke-forgeViz-1" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" /> : null}
          {datos.actual.map((p, i) =>
            esFinito(p.y) ? (
              <circle key={i} data-punto="" cx={redondear(px(i))} cy={py(p.y)} r="3.5" className="fill-forgeSurface-card stroke-forgeViz-1" strokeWidth="2">
                <title>{`${etiquetaCorta(p.x)}: ${fmt(p.y)}`}</title>
              </circle>
            ) : null
          )}
        </svg>
      </div>
    </PanelGrafico>
  );
}
