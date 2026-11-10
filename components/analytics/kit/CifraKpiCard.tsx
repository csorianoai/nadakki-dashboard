"use client";

import "./tema.css";
import type { ReactNode } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { KpiCard } from "@/components/forge/ui/KpiCard";
import { EstadoAnalitica, type EstadoNoOk } from "./EstadoAnalitica";
import { useFormato } from "./FormatoProvider";
import { calcularVariacion, estadoEfectivo, formatearFecha, formatearPorcentaje, formatearValor, type Cifra } from "@/lib/analytics/cifra";
import { cn } from "@/lib/utils";

export interface CifraKpiCardProps {
  cifra: Cifra;
  etiquetaComparacion?: string;
  onReintentar?: () => void;
  className?: string;
}

/**
 * Tarjeta KPI de analitica: valor + variacion vs periodo anterior + fuente y fecha.
 * Compone components/forge/ui/KpiCard (sin modificarlo) y dibuja la variacion aparte para poder
 * colorearla por "mejora/empeora" (un costo que sube no es verde) y para no anunciarla dos veces.
 */
export function CifraKpiCard({ cifra, etiquetaComparacion = "vs periodo anterior", onReintentar, className }: CifraKpiCardProps) {
  const formato = useFormato();
  const estado = estadoEfectivo(cifra);

  if (estado !== "ok") {
    return (
      <div role="group" aria-label={cifra.etiqueta} className={cn("kit-tema min-w-0", className)}>
        <p className="mb-2 text-forge-xs font-medium uppercase tracking-wide kit-txt-3">{cifra.etiqueta}</p>
        <EstadoAnalitica estado={estado as EstadoNoOk} compacto descripcion={cifra.mensaje} onReintentar={onReintentar} />
      </div>
    );
  }

  const variacion = calcularVariacion(cifra.valor, cifra.valor_anterior);
  const mejorSi = cifra.mejor_si ?? "sube";
  const fecha = formatearFecha(cifra.fecha_dato, formato);

  let sentido: "mejor" | "peor" | "igual" = "igual";
  if (variacion.estado === "ok" && variacion.direccion !== "neutral") {
    sentido = (variacion.direccion === "up") === (mejorSi === "sube") ? "mejor" : "peor";
  }
  const color = sentido === "mejor" ? "kit-txt-ok" : sentido === "peor" ? "kit-txt-error" : "kit-txt-2";

  let linea: ReactNode;
  if (variacion.estado === "ok") {
    const Icono = variacion.direccion === "up" ? TrendingUp : variacion.direccion === "down" ? TrendingDown : Minus;
    const signo = variacion.porcentaje > 0 ? "+" : variacion.porcentaje < 0 ? "−" : "";
    linea = (
      <p data-testid="cifra-variacion" data-sentido={sentido} className={cn("flex flex-wrap items-center gap-1 text-[13px]", color)}>
        <Icono className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <span className="font-medium tabular-nums">{`${signo}${formatearPorcentaje(Math.abs(variacion.porcentaje), 1, formato)}`}</span>
        <span className="kit-txt-2">{etiquetaComparacion}</span>
      </p>
    );
  } else {
    linea = (
      <p data-testid="cifra-variacion-insuficiente" className="text-forge-xs kit-txt-2">
        Datos insuficientes para comparar con el periodo anterior
      </p>
    );
  }

  return (
    <div role="group" aria-label={cifra.etiqueta} className={cn("kit-tema min-w-0", className)}>
      <KpiCard label={cifra.etiqueta} value={<span className="break-words">{formatearValor(cifra, formato)}</span>} />
      <div className="mt-2 space-y-1 px-1">
        {linea}
        <p className="text-forge-xs kit-txt-3">
          <span>Fuente: {cifra.fuente}</span>
          <span aria-hidden> · </span>
          <span>Dato al {fecha}</span>
        </p>
      </div>
    </div>
  );
}

export function GrillaKpi({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4", className)}>{children}</div>;
}
