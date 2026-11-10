"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

export interface OpcionFiltro {
  valor: string;
  etiqueta: string;
}

export interface FiltroDef {
  id: string;
  etiqueta: string;
  valor: string;
  opciones: OpcionFiltro[];
  /** Valor que equivale a "sin filtrar" (por defecto el de la primera opcion). */
  valorPorDefecto?: string;
}

export interface BarraFiltrosProps {
  filtros: FiltroDef[];
  onChange: (id: string, valor: string) => void;
  onLimpiar?: () => void;
  className?: string;
}

const FOCO =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-600";

/** Barra de filtros generica: un select nativo con etiqueta por filtro; apila en movil. */
export function BarraFiltros({ filtros, onChange, onLimpiar, className }: BarraFiltrosProps) {
  const id = useId();
  if (filtros.length === 0) return null;
  const hayActivos = filtros.some((f) => f.valor !== (f.valorPorDefecto ?? f.opciones[0]?.valor));

  return (
    <div role="search" aria-label="Filtros" className={cn("grid grid-cols-1 items-end gap-3 sm:grid-cols-2 lg:flex lg:flex-wrap", className)}>
      {filtros.map((f) => (
        <div key={f.id} className="min-w-0 lg:w-56">
          <label htmlFor={`${id}-${f.id}`} className="mb-1 block text-forge-xs font-medium text-forgeGray-600">
            {f.etiqueta}
          </label>
          <select
            id={`${id}-${f.id}`}
            value={f.valor}
            onChange={(e) => onChange(f.id, e.target.value)}
            className={cn(
              "min-h-[44px] w-full min-w-0 rounded-forge-sm border border-forgeGray-200 bg-forgeSurface-card px-3 text-forge-sm text-forgeGray-800",
              FOCO
            )}
          >
            {f.opciones.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.etiqueta}
              </option>
            ))}
          </select>
        </div>
      ))}
      {onLimpiar && hayActivos ? (
        <button
          type="button"
          onClick={onLimpiar}
          className={cn(
            "min-h-[44px] rounded-forge-sm border border-forgeGray-200 bg-forgeSurface-card px-4 text-forge-sm font-medium text-forgeGray-800 hover:bg-forgeGray-50",
            FOCO
          )}
        >
          Limpiar filtros
        </button>
      ) : null}
    </div>
  );
}
