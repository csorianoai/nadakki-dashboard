"use client";

import { useRef, useState } from "react";
import { PanelGrafico } from "./PanelGrafico";
import { useAncho } from "./useAncho";
import { formatearValor, type EstadoCifra, type UnidadCifra } from "@/lib/analytics/cifra";
import { escalar, esFinito, estadoGrafico, etiquetaUnidad, margenIzquierdo, redondear, ticksLineales, type MetaGrafico, type PuntoDispersion } from "@/lib/analytics/graficos";

export interface EjeDispersion {
  etiqueta: string;
  unidad: UnidadCifra;
  moneda?: string;
}

export interface DispersionProps {
  meta: MetaGrafico;
  puntos: PuntoDispersion[];
  ejeX: EjeDispersion;
  ejeY: EjeDispersion;
  ancho?: number;
  onReintentar?: () => void;
  className?: string;
}

const rotulo = (e: EjeDispersion) => {
  const u = etiquetaUnidad(e.unidad, e.moneda);
  return u ? `${e.etiqueta} (${u})` : e.etiqueta;
};

/** Dispersion en SVG propio: cada punto es focusable, tiene nombre accesible y su detalle se anuncia en una region viva. */
export function Dispersion({ meta, puntos, ejeX, ejeY, ancho: anchoInicial = 520, onReintentar, className }: DispersionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [activo, setActivo] = useState<string | null>(null);
  const ancho = Math.max(240, useAncho(ref, anchoInicial));
  const alto = Math.round(Math.min(360, Math.max(220, ancho * 0.6)));

  const validos = puntos.filter((p): p is PuntoDispersion & { x: number; y: number } => esFinito(p.x) && esFinito(p.y));
  const omitidos = puntos.length - validos.length;
  let estado: EstadoCifra = estadoGrafico(meta, puntos.length);
  if (estado === "ok" && validos.length === 0) estado = "datos_insuficientes";

  const fx = (v: number) => formatearValor({ valor: v, unidad: ejeX.unidad, moneda: ejeX.moneda });
  const fy = (v: number) => formatearValor({ valor: v, unidad: ejeY.unidad, moneda: ejeY.moneda });
  const xs = validos.map((p) => p.x);
  const ys = validos.map((p) => p.y);
  const tx = xs.length ? ticksLineales(Math.min(...xs), Math.max(...xs), 4) : [0, 1];
  const ty = ys.length ? ticksLineales(Math.min(...ys), Math.max(...ys), 4) : [0, 1];
  const M = { izq: margenIzquierdo(ty.map(fy)) + 18, der: 14, arr: 12, aba: 44 };
  const domX: [number, number] = [tx[0], tx[tx.length - 1]];
  const domY: [number, number] = [ty[0], ty[ty.length - 1]];
  const px = (v: number) => redondear(escalar(v, domX, [M.izq, ancho - M.der]));
  const py = (v: number) => redondear(escalar(v, domY, [alto - M.aba, M.arr]));
  const detalle = (p: { etiqueta: string; x: number; y: number }) => `${p.etiqueta}: ${ejeX.etiqueta} ${fx(p.x)}, ${ejeY.etiqueta} ${fy(p.y)}`;
  const sel = validos.find((p) => p.id === activo);

  const tabla = { columnas: ["Punto", ejeX.etiqueta, ejeY.etiqueta], filas: validos.map((p) => [p.etiqueta, fx(p.x), fy(p.y)]) };

  return (
    <PanelGrafico
      meta={meta}
      estado={estado}
      tabla={tabla}
      onReintentar={onReintentar}
      className={className}
      nota={omitidos > 0 ? `${omitidos} ${omitidos === 1 ? "punto omitido" : "puntos omitidos"} por no tener valor en algún eje.` : undefined}
    >
      <div ref={ref} className="min-w-0">
        <svg role="group" aria-label={`Dispersión: ${meta.titulo}. ${validos.length} ${validos.length === 1 ? "punto" : "puntos"}; eje horizontal ${rotulo(ejeX)}, eje vertical ${rotulo(ejeY)}.`} viewBox={`0 0 ${ancho} ${alto}`} className="block h-auto w-full" preserveAspectRatio="xMidYMid meet">
          {ty.map((t) => (
            <g key={`y${t}`}>
              <line x1={M.izq} x2={ancho - M.der} y1={py(t)} y2={py(t)} className="stroke-forgeGray-200" strokeWidth="1" />
              <text x={M.izq - 6} y={py(t)} textAnchor="end" dominantBaseline="middle" className="fill-forgeGray-600 text-[11px]">
                {fy(t)}
              </text>
            </g>
          ))}
          {tx.map((t, k) => (
            <text key={`x${t}`} x={px(t)} y={alto - M.aba + 16} textAnchor={k === 0 ? "start" : k === tx.length - 1 ? "end" : "middle"} className="fill-forgeGray-600 text-[11px]">
              {fx(t)}
            </text>
          ))}
          <text x={(M.izq + ancho - M.der) / 2} y={alto - 6} textAnchor="middle" className="fill-forgeGray-700 text-[11px] font-medium">
            {rotulo(ejeX)}
          </text>
          <text transform={`translate(14 ${(M.arr + alto - M.aba) / 2}) rotate(-90)`} textAnchor="middle" className="fill-forgeGray-700 text-[11px] font-medium">
            {rotulo(ejeY)}
          </text>
          {validos.map((p) => (
            <circle
              key={p.id}
              data-punto=""
              role="img"
              tabIndex={0}
              aria-label={detalle(p)}
              cx={px(p.x)}
              cy={py(p.y)}
              r={activo === p.id ? 8 : 6}
              fillOpacity="0.65"
              strokeWidth="2"
              className="fill-forgeViz-1 stroke-forgeViz-1 outline-none focus-visible:stroke-forgeBrand-950"
              onFocus={() => setActivo(p.id)}
              onBlur={() => setActivo(null)}
              onMouseEnter={() => setActivo(p.id)}
              onMouseLeave={() => setActivo(null)}
            >
              <title>{detalle(p)}</title>
            </circle>
          ))}
        </svg>
        <p role="status" aria-live="polite" aria-label="Detalle del punto seleccionado" className="mt-2 min-h-[1.5rem] text-forge-xs text-forgeGray-700">
          {sel ? detalle(sel) : "Enfoca o pasa el cursor sobre un punto para ver su detalle."}
        </p>
      </div>
    </PanelGrafico>
  );
}
