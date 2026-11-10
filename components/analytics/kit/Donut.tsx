"use client";

import { useState } from "react";
import { PanelGrafico } from "./PanelGrafico";
import { formatearPorcentaje, formatearValor, type EstadoCifra, type UnidadCifra } from "@/lib/analytics/cifra";
import { agruparTopN, estadoGrafico, redondear, type DatoCategoria, type MetaGrafico } from "@/lib/analytics/graficos";
import { cn } from "@/lib/utils";

export interface DonutProps {
  meta: MetaGrafico;
  datos: DatoCategoria[];
  unidad: UnidadCifra;
  moneda?: string;
  /** Categorias antes de agrupar el resto en "Otros" (maximo 6, una por color de la paleta). */
  maxCategorias?: number;
  onReintentar?: () => void;
  className?: string;
}

/* Clases literales para que Tailwind las genere; "Otros" va siempre en gris. */
const TRAZOS = ["stroke-forgeViz-1", "stroke-forgeViz-2", "stroke-forgeViz-3", "stroke-forgeViz-4", "stroke-forgeViz-5", "stroke-forgeViz-6"];
const RELLENOS = ["bg-forgeViz-1", "bg-forgeViz-2", "bg-forgeViz-3", "bg-forgeViz-4", "bg-forgeViz-5", "bg-forgeViz-6"];

const R = 70;
const C = 2 * Math.PI * R;

/** Donut en SVG propio con leyenda en texto operable con teclado (etiqueta, valor y porcentaje por categoria). */
export function Donut({ meta, datos, unidad, moneda, maxCategorias = 5, onReintentar, className }: DonutProps) {
  const [activo, setActivo] = useState<number | null>(null);
  const { items, descartados } = agruparTopN(datos, Math.min(6, Math.max(1, maxCategorias)));
  const total = items.reduce((s, d) => s + d.valor, 0);
  let estado: EstadoCifra = estadoGrafico(meta, datos.length);
  if (estado === "ok" && (items.length === 0 || !(total > 0))) estado = "datos_insuficientes";
  const fmt = (v: number) => formatearValor({ valor: v, unidad, moneda });
  const pct = (v: number) => (total > 0 ? Math.round((v / total) * 1000) / 10 : 0);
  const esOtros = (i: number) => i === items.length - 1 && items[i].etiqueta === "Otros";

  let acum = 0;
  const segmentos = items.map((d, i) => {
    const largo = total > 0 ? (d.valor / total) * C : 0;
    const seg = { d, i, largo: redondear(largo, 3), desplazamiento: redondear(-acum, 3) };
    acum += largo;
    return seg;
  });

  const tabla = { columnas: ["Categoría", "Valor", "Porcentaje"], filas: items.map((d) => [d.etiqueta, fmt(d.valor), formatearPorcentaje(pct(d.valor), 1)]) };
  const nota = descartados > 0 ? `${descartados} ${descartados === 1 ? "categoría descartada" : "categorías descartadas"} (valor cero, negativo o sin dato).` : undefined;

  return (
    <PanelGrafico meta={meta} estado={estado} tabla={tabla} nota={nota} onReintentar={onReintentar} className={className}>
      <div className="flex min-w-0 flex-col items-center gap-4 sm:flex-row sm:items-start">
        <svg role="img" aria-label={`Donut: ${meta.titulo}. Total ${fmt(total)} en ${items.length} ${items.length === 1 ? "categoría" : "categorías"}.`} viewBox="0 0 200 200" className="block h-auto w-full max-w-[200px] shrink-0">
          <g transform="rotate(-90 100 100)">
            {segmentos.map(({ d, i, largo, desplazamiento }) => (
              <circle
                key={d.etiqueta}
                data-segmento=""
                data-activo={activo === i ? "true" : "false"}
                cx="100"
                cy="100"
                r={R}
                fill="none"
                strokeWidth={activo === i ? 34 : 28}
                strokeDasharray={`${largo} ${redondear(C - largo, 3)}`}
                strokeDashoffset={desplazamiento}
                className={esOtros(i) ? "stroke-forgeGray-400" : TRAZOS[i % TRAZOS.length]}
              >
                <title>{`${d.etiqueta}: ${fmt(d.valor)} (${formatearPorcentaje(pct(d.valor), 1)})`}</title>
              </circle>
            ))}
          </g>
          <text x="100" y="96" textAnchor="middle" className="fill-forgeGray-600 text-[11px]">
            Total
          </text>
          <text x="100" y="116" textAnchor="middle" className="fill-forgeGray-800 text-[16px] font-semibold">
            {fmt(total)}
          </text>
        </svg>
        <ul role="list" aria-label={`Leyenda: ${meta.titulo}`} className="m-0 flex w-full min-w-0 list-none flex-col gap-1 p-0">
          {items.map((d, i) => (
            <li
              key={d.etiqueta}
              tabIndex={0}
              onFocus={() => setActivo(i)}
              onBlur={() => setActivo(null)}
              onMouseEnter={() => setActivo(i)}
              onMouseLeave={() => setActivo(null)}
              className={cn(
                "flex min-h-[44px] items-center gap-2 rounded-forge-sm px-2 text-forge-xs text-forgeGray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-600",
                activo === i && "bg-forgeGray-50"
              )}
            >
              <span className={cn("inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white", esOtros(i) ? "bg-forgeGray-500" : RELLENOS[i % RELLENOS.length])}>
                {i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate" title={d.etiqueta}>
                {d.etiqueta}
              </span>
              <span className="tabular-nums">{fmt(d.valor)}</span>
              <span className="w-14 text-right font-medium tabular-nums">{formatearPorcentaje(pct(d.valor), 1)}</span>
            </li>
          ))}
        </ul>
      </div>
    </PanelGrafico>
  );
}
