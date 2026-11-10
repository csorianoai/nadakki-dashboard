"use client";

import { PanelGrafico } from "./PanelGrafico";
import { formatearPorcentaje, formatearValor } from "@/lib/analytics/cifra";
import { calcularEmbudo, estadoGrafico, redondear, type EtapaEmbudo, type MetaGrafico, type Porcentaje } from "@/lib/analytics/graficos";

export interface EmbudoProps {
  meta: MetaGrafico;
  etapas: EtapaEmbudo[];
  onReintentar?: () => void;
  className?: string;
}

const texto = (p: Porcentaje | null) => (p && p.estado === "ok" ? formatearPorcentaje(p.porcentaje, 1) : "Datos insuficientes");

/** Embudo por etapas: barras escaladas contra la primera etapa, conversion desde la etapa anterior y conversion total. */
export function Embudo({ meta, etapas, onReintentar, className }: EmbudoProps) {
  const estado = estadoGrafico(meta, etapas.length, 2);
  const { filas, total } = calcularEmbudo(etapas);
  const primera = filas[0]?.valor ?? null;
  const fmt = (v: number | null) => formatearValor({ valor: v, unidad: "numero" });
  const ancho = (v: number | null) => (primera && primera > 0 && v !== null ? redondear(Math.min(100, Math.max(0, (v / primera) * 100)), 2) : 0);

  const tabla = {
    columnas: ["Etapa", "Valor", "Conversión desde la etapa anterior", "Porcentaje del inicio"],
    filas: filas.map((f) => [f.etiqueta, fmt(f.valor), f.conversion_previa === null ? "—" : texto(f.conversion_previa), texto(f.porcentaje_inicio)]),
  };

  return (
    <PanelGrafico meta={meta} estado={estado} tabla={tabla} onReintentar={onReintentar} className={className}>
      <ol aria-label={`Embudo: ${meta.titulo}`} className="m-0 flex list-none flex-col gap-3 p-0">
        {filas.map((f, i) => (
          <li key={`${f.etiqueta}-${i}`} className="min-w-0 text-forge-xs text-forgeGray-800">
            <div className="flex items-baseline justify-between gap-2">
              <span className="min-w-0 truncate font-medium" title={f.etiqueta}>
                {i + 1}. {f.etiqueta}
              </span>
              <span className="font-semibold tabular-nums">{fmt(f.valor)}</span>
            </div>
            <div className="mt-1 h-3 rounded-full bg-forgeGray-100" aria-hidden>
              <div data-barra="" className="h-3 rounded-full bg-forgeViz-1" style={{ width: `${ancho(f.valor)}%` }} />
            </div>
            <p className="mt-1 text-forgeGray-600">
              {f.conversion_previa === null ? (
                "Etapa inicial"
              ) : f.conversion_previa.estado === "ok" ? (
                <>
                  <span className="font-medium tabular-nums">{formatearPorcentaje(f.conversion_previa.porcentaje, 1)}</span> de la etapa anterior
                </>
              ) : (
                "Datos insuficientes para calcular la conversión"
              )}
              {f.anomalia ? <span className="ml-2 font-medium text-forgeWarning-700">Revisar definición de etapas: supera a la etapa anterior</span> : null}
            </p>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-forge-sm text-forgeGray-800">
        <span>Conversión total (última etapa ÷ primera):</span> <strong className="tabular-nums">{texto(total)}</strong>
      </p>
    </PanelGrafico>
  );
}
