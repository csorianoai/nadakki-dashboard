"use client";

import "./tema.css";
import type { ReactNode } from "react";
import { EmptyState } from "@/components/forge/ui/EmptyState";
import { Skeleton } from "@/components/forge/ui/Skeleton";
import { cn } from "@/lib/utils";
import type { EstadoCifra } from "@/lib/analytics/cifra";

export type EstadoNoOk = Exclude<EstadoCifra, "ok">;

const TEXTOS: Record<EstadoNoOk, { titulo: string; descripcion?: string }> = {
  cargando: { titulo: "Cargando datos" },
  error: { titulo: "No se pudieron cargar los datos", descripcion: "Intenta de nuevo. Si persiste, avisa a soporte." },
  vacio: { titulo: "Sin datos en este periodo", descripcion: "Prueba con otro periodo o quita algún filtro." },
  datos_insuficientes: { titulo: "Datos insuficientes", descripcion: "Todavía no hay base suficiente para calcular esta cifra." },
  pendiente_integracion: { titulo: "Fuente aún no conectada", descripcion: "Este dato se mostrará cuando la integración esté activa." },
};

export interface EstadoAnaliticaProps {
  estado: EstadoNoOk;
  titulo?: string;
  descripcion?: string;
  onReintentar?: () => void;
  /** Version baja para tarjetas KPI. */
  compacto?: boolean;
  className?: string;
  accion?: ReactNode;
}

/** Estados no-ok de cualquier panel de analitica. Reutiliza EmptyState y Skeleton del sistema Forge. */
export function EstadoAnalitica({ estado, titulo, descripcion, onReintentar, compacto = false, className, accion }: EstadoAnaliticaProps) {
  const base = TEXTOS[estado];
  const t = titulo ?? base.titulo;
  const d = descripcion ?? base.descripcion;

  if (estado === "cargando") {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label={t}
        data-estado="cargando"
        className={cn("kit-tema rounded-forge-md border kit-bd kit-bg-sup p-5", className)}
      >
        <Skeleton className="h-3 w-24" />
        <Skeleton className={cn("mt-3 w-32", compacto ? "h-8" : "h-10")} />
        {compacto ? null : <Skeleton className="mt-4 h-24 w-full" />}
      </div>
    );
  }

  const reintentar =
    estado === "error" && onReintentar ? (
      <button
        type="button"
        onClick={onReintentar}
        className="min-h-[44px] rounded-forge-sm border kit-ctl px-4 text-forge-sm font-medium kit-foco"
      >
        Reintentar
      </button>
    ) : null;

  return (
    <div
      role={estado === "error" ? "alert" : "status"}
      data-estado={estado}
      className={cn("kit-tema min-w-0", className)}
    >
      {estado === "pendiente_integracion" ? (
        <span className="mb-2 inline-block rounded-full border px-2 py-0.5 text-forge-xs font-medium kit-chip-pendiente">
          Pendiente de integración
        </span>
      ) : null}
      <EmptyState
        title={t}
        description={d}
        titleLevel={3}
        className={cn(compacto && "p-4")}
        action={
          reintentar || accion ? (
            <div className="flex flex-wrap gap-2">
              {reintentar}
              {accion}
            </div>
          ) : undefined
        }
      />
    </div>
  );
}
