"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { NOTA } from "./estilos";

export interface ControlInhabilitadoProps {
  children: ReactNode;
  /** Condicion para que se habilite: «Disponible cuando …». Obligatoria: un control apagado siempre dice por que. */
  disponibleCuando: string;
  className?: string;
  /** Mostrar el texto «Disponible cuando …» a la vista (por defecto solo para tecnologias de asistencia y tooltip). */
  visible?: boolean;
}

/**
 * Control NO funcional todavia. Es un boton con aria-disabled="true" (sigue siendo alcanzable con teclado para poder
 * leer por que esta apagado) cuyo clic no hace nada. Nunca parece un control activo y nunca ejecuta una accion.
 */
export function ControlInhabilitado({ children, disponibleCuando, className, visible = false }: ControlInhabilitadoProps) {
  const id = useId();
  const texto = `Disponible cuando ${disponibleCuando}`;
  return (
    <span className="inline-flex min-w-0 flex-col gap-1">
      <button
        type="button"
        aria-disabled="true"
        aria-describedby={id}
        title={texto}
        data-control="inhabilitado"
        onClick={(e) => e.preventDefault()}
        className={cn(
          "kit-foco kit-bg-hundida kit-bd-control kit-txt-2 min-h-[44px] max-w-full cursor-not-allowed rounded-[10px] border border-dashed px-3 text-left text-[13px] font-medium",
          className
        )}
      >
        {children}
      </button>
      <span id={id} className={visible ? NOTA : "sr-only"}>
        {texto}
      </span>
    </span>
  );
}
