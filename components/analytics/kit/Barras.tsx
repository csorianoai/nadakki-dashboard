"use client";

import "./tema.css";
import { useRef } from "react";
import { PanelGrafico } from "./PanelGrafico";
import { useAncho } from "./useAncho";
import { formatearValor, type EstadoCifra, type UnidadCifra } from "@/lib/analytics/cifra";
import { useFormato } from "./FormatoProvider";
import { escalar, esFinito, estadoGrafico, margenIzquierdo, ordenarCategorias, redondear, ticksLineales, type DatoCategoria, type MetaGrafico } from "@/lib/analytics/graficos";

export interface BarrasProps {
  meta: MetaGrafico;
  datos: DatoCategoria[];
  unidad: UnidadCifra;
  moneda?: string;
  orientacion?: "horizontal" | "vertical";
  /** Ordena de mayor a menor (por defecto). */
  ordenar?: boolean;
  /** Maximo de barras visibles; la tabla alternativa trae todas. */
  maximo?: number;
  ancho?: number;
  onReintentar?: () => void;
  className?: string;
}

const pc = (n: number) => `${redondear(Math.min(100, Math.max(0, n)), 2)}%`;

export function Barras({ meta, datos, unidad, moneda, orientacion = "horizontal", ordenar = true, maximo = 10, ancho: anchoInicial = 480, onReintentar, className }: BarrasProps) {
  const ref = useRef<HTMLDivElement>(null);
  const ancho = Math.max(240, useAncho(ref, anchoInicial));
  const validos = datos.filter((d) => esFinito(d.valor)).length;
  let estado: EstadoCifra = estadoGrafico(meta, datos.length);
  if (estado === "ok" && validos === 0) estado = "datos_insuficientes";
  const formato = useFormato();
  const fmt = (v: number | null) => formatearValor({ valor: v, unidad, moneda }, formato);

  const lista = (ordenar ? ordenarCategorias(datos) : [...datos]).filter((d) => esFinito(d.valor));
  const visibles = lista.slice(0, Math.max(1, maximo));
  const valores = visibles.map((d) => d.valor as number);
  const maxPos = Math.max(0, ...valores);
  const maxNeg = Math.abs(Math.min(0, ...valores));
  const span = maxPos + maxNeg;
  const cero = span === 0 ? 0 : (maxNeg / span) * 100;

  const tabla = { columnas: ["Categoría", "Valor"], filas: lista.map((d) => [d.etiqueta, fmt(d.valor)]) };
  const nota = lista.length > visibles.length ? `Mostrando ${visibles.length} de ${lista.length}. La tabla de datos trae todas.` : undefined;
  const resumen = `Barras: ${meta.titulo}. ${visibles.length} categorías, de ${fmt(Math.min(...valores))} a ${fmt(Math.max(...valores))}.`;

  return (
    <PanelGrafico meta={meta} estado={estado} tabla={tabla} nota={nota} onReintentar={onReintentar} className={className}>
      <div ref={ref} className="min-w-0">
        {orientacion === "horizontal" ? (
          <ul role="list" aria-label={`Barras: ${meta.titulo}`} className="m-0 flex list-none flex-col gap-2 p-0">
            {visibles.map((d) => {
              const v = d.valor as number;
              const w = span === 0 ? 0 : (Math.abs(v) / span) * 100;
              const izq = v < 0 ? cero - w : cero;
              return (
                <li key={d.etiqueta} className="grid grid-cols-[minmax(0,7rem)_minmax(0,1fr)_auto] items-center gap-2 text-forge-xs kit-txt sm:grid-cols-[minmax(0,10rem)_minmax(0,1fr)_auto]">
                  <span className="truncate" title={d.etiqueta}>
                    {d.etiqueta}
                  </span>
                  <span className="relative block h-3 rounded-full kit-bg-hundida-2" aria-hidden>
                    <span data-barra="" data-signo={v < 0 ? "negativo" : "positivo"} className={`absolute top-0 h-3 rounded-full ${v < 0 ? "kit-bg-error" : "kit-bg-viz-1"}`} style={{ left: pc(izq), width: pc(w) }} />
                    {maxNeg > 0 ? <span className="absolute top-[-2px] h-4 w-px kit-bg-cero" style={{ left: pc(cero) }} /> : null}
                  </span>
                  <span className="text-right font-medium tabular-nums">{fmt(v)}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <BarrasVerticales ancho={ancho} visibles={visibles} fmt={fmt} resumen={resumen} />
        )}
      </div>
    </PanelGrafico>
  );
}

function BarrasVerticales({ ancho, visibles, fmt, resumen }: { ancho: number; visibles: DatoCategoria[]; fmt: (v: number | null) => string; resumen: string }) {
  const alto = Math.round(Math.min(300, Math.max(180, ancho * 0.5)));
  const valores = visibles.map((d) => d.valor as number);
  const ticks = ticksLineales(Math.min(0, ...valores), Math.max(0, ...valores), 4);
  const M = { izq: margenIzquierdo(ticks.map(fmt)), der: 8, arr: 14, aba: 36 };
  const dom: [number, number] = [ticks[0], ticks[ticks.length - 1]];
  const plotW = ancho - M.izq - M.der;
  const paso = plotW / Math.max(1, visibles.length);
  const bw = Math.max(4, Math.min(48, paso * 0.6));
  const py = (v: number) => redondear(escalar(v, dom, [alto - M.aba, M.arr]));
  const y0 = py(0);
  const corto = (s: string) => (s.length > Math.max(4, Math.floor(paso / 6)) ? `${s.slice(0, Math.max(3, Math.floor(paso / 6) - 1))}…` : s);
  return (
    <svg role="img" aria-label={resumen} viewBox={`0 0 ${ancho} ${alto}`} className="block h-auto w-full" preserveAspectRatio="xMidYMid meet">
      {ticks.map((t) => (
        <g key={t}>
          <line x1={M.izq} x2={ancho - M.der} y1={py(t)} y2={py(t)} className={t === 0 ? "kit-stroke-cero" : "kit-stroke-grid"} strokeWidth="1" />
          <text x={M.izq - 6} y={py(t)} textAnchor="end" dominantBaseline="middle" className="kit-fill-txt-2 text-[11px]">
            {fmt(t)}
          </text>
        </g>
      ))}
      {visibles.map((d, i) => {
        const v = d.valor as number;
        const cx = M.izq + paso * i + paso / 2;
        const y = py(v);
        return (
          <g key={d.etiqueta}>
            <rect data-barra="" data-signo={v < 0 ? "negativo" : "positivo"} x={redondear(cx - bw / 2)} y={Math.min(y, y0)} width={redondear(bw)} height={redondear(Math.max(1, Math.abs(y0 - y)))} rx="2" className={v < 0 ? "kit-fill-error" : "kit-fill-viz-1"}>
              <title>{`${d.etiqueta}: ${fmt(v)}`}</title>
            </rect>
            <text x={cx} y={alto - 14} textAnchor="middle" className="kit-fill-txt-2 text-[11px]">
              {corto(d.etiqueta)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
