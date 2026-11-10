"use client";

import type { ReactNode } from "react";
import { Minus, TrendingDown, TrendingUp } from "lucide-react";
import { CifraKpiCard, useFormato } from "@/components/analytics/kit";
import { calcularVariacion, estadoEfectivo, formatearFecha, formatearPorcentaje, formatearValor, type Cifra } from "@/lib/analytics/cifra";
import { cn } from "@/lib/utils";
import { CIFRA_GRANDE, ETIQUETA, NOTA, TARJETA } from "./estilos";

export interface KpiDominanteProps {
  cifra: Cifra;
  /** Chip de estado a la derecha de la etiqueta (p. ej. «Rendimiento preliminar»). */
  chip?: ReactNode;
  /** Tamaño del numero: "hero" (el KPI principal en movil) o "normal". En escritorio todos miden igual. */
  tamano?: "hero" | "normal";
  /** Resalta el borde con un token de estado (solo cuando la lectura lo justifica). */
  borde?: "neutro" | "acento";
  /** Variacion abreviada («vs anterior», sin el valor): para tarjetas pequeñas en movil. */
  corto?: boolean;
  /** Movil: relleno y huecos reducidos para que los tres indicadores quepan en el primer viewport (el valor sigue siendo grande y legible). */
  compacto?: boolean;
  /** Movil: no repite «Fuente · Dato al» dentro de la tarjeta; una linea agrupada (FuentesResumen) cubre la cifra por su nombre. */
  sinFuente?: boolean;
  /** Contenido adicional bajo la variacion (lectura, supuestos, aviso de CRM). */
  children?: ReactNode;
  className?: string;
}

/**
 * Indicador dominante de la pantalla patron: etiqueta, numero grande (Display), variacion vs periodo anterior (con el valor
 * anterior), y fuente + fecha del dato. Misma regla que CifraKpiCard del kit (que se usa tal cual cuando la cifra no esta «ok»):
 * sin fuente o sin fecha => «pendiente de integracion»; periodo anterior nulo o 0 => «datos insuficientes» para comparar; nunca NaN.
 * Un costo que baja es mejora (mejor_si = "baja"). Locale y moneda salen del tenant (useFormato).
 */
export function KpiDominante({ cifra, chip, tamano = "normal", borde = "neutro", corto = false, compacto = false, sinFuente = false, children, className }: KpiDominanteProps) {
  const formato = useFormato();
  const estado = estadoEfectivo(cifra);

  if (estado !== "ok") {
    return (
      <div className={cn(TARJETA, "p-5", className)}>
        <CifraKpiCard cifra={cifra} />
      </div>
    );
  }

  const variacion = calcularVariacion(cifra.valor, cifra.valor_anterior);
  const mejorSi = cifra.mejor_si ?? "sube";
  let sentido: "mejor" | "peor" | "igual" = "igual";
  if (variacion.estado === "ok" && variacion.direccion !== "neutral") sentido = (variacion.direccion === "up") === (mejorSi === "sube") ? "mejor" : "peor";
  const color = sentido === "mejor" ? "kit-txt-ok" : sentido === "peor" ? "kit-txt-error" : "kit-txt-2";
  const Icono = variacion.estado === "ok" ? (variacion.direccion === "up" ? TrendingUp : variacion.direccion === "down" ? TrendingDown : Minus) : Minus;
  const signo = variacion.estado === "ok" ? (variacion.porcentaje > 0 ? "+" : variacion.porcentaje < 0 ? "−" : "") : "";
  const anterior = cifra.valor_anterior !== null && cifra.valor_anterior !== undefined ? formatearValor({ ...cifra, valor: cifra.valor_anterior }, formato) : null;

  return (
    <section
      role="group"
      aria-label={cifra.etiqueta}
      className={cn(TARJETA, "flex h-full flex-col sm:p-5 lg:gap-2.5 lg:p-[22px]", compacto ? "gap-1 p-3 sm:gap-2" : "gap-2 p-4", borde === "acento" ? "kit-bd-acento" : "", className)}
    >
      <div className="flex min-w-0 items-center justify-between gap-2">
        <span data-testid="kpi-etiqueta" className={cn(ETIQUETA, "font-medium")}>{cifra.etiqueta}</span>
        {chip}
      </div>
      <span data-testid="kpi-valor" className={cn(CIFRA_GRANDE, tamano === "hero" ? (compacto ? "text-[36px] leading-[1.05]" : "text-[40px] leading-[1.05]") : "text-[24px] leading-[1.1] min-[360px]:text-[28px]", "sm:text-[34px] lg:text-[40px] xl:text-[44px]")}>{formatearValor(cifra, formato)}</span>
      {variacion.estado === "ok" ? (
        <p data-testid="cifra-variacion" data-sentido={sentido} className={cn("m-0 flex flex-wrap items-center gap-x-1.5 text-[13px]", color)}>
          <Icono className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="font-semibold tabular-nums">{`${signo}${formatearPorcentaje(Math.abs(variacion.porcentaje), 1, formato)}`}</span>
          <span className="kit-txt-2">{corto ? "vs anterior" : anterior ? `vs ${anterior} periodo anterior` : "vs periodo anterior"}</span>
        </p>
      ) : (
        <p data-testid="cifra-variacion-insuficiente" className="m-0 text-[12px] kit-txt-2">
          Datos insuficientes para comparar con el periodo anterior
        </p>
      )}
      {children}
      {sinFuente ? null : (
        <p className={cn("m-0 mt-auto pt-1", NOTA)}>
          <span>Fuente: {cifra.fuente}</span>
          <span aria-hidden> · </span>
          <span>Dato al {formatearFecha(cifra.fecha_dato, formato)}</span>
        </p>
      )}
    </section>
  );
}
