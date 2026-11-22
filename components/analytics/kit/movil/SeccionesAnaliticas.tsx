"use client";

import "../tema.css";
import { useState, type ReactNode } from "react";
import { Tabs } from "@/components/forge/ui/Tabs";
import { cn } from "@/lib/utils";
import { useEsMovil } from "./useEsMovil";

export interface SeccionAnalitica {
  id: string;
  titulo: string;
  contenido: ReactNode;
}

export interface SeccionesAnaliticasProps {
  secciones: SeccionAnalitica[];
  /** Pestaña inicial en movil (por defecto la primera). */
  inicial?: string;
  className?: string;
}

/**
 * Escritorio: las secciones se apilan con su encabezado.
 * Movil (< 640 px): una pestaña por seccion (Tabs de Forge) y solo el panel activo; no es el escritorio comprimido.
 */
export function SeccionesAnaliticas({ secciones, inicial, className }: SeccionesAnaliticasProps) {
  const movil = useEsMovil();
  const [activa, setActiva] = useState<string | undefined>(inicial);
  if (secciones.length === 0) return null;

  if (!movil) {
    return (
      <div className={cn("kit-tema space-y-6", className)}>
        {secciones.map((s) => (
          <section key={s.id} aria-labelledby={`seccion-${s.id}`} className="min-w-0">
            <h2 id={`seccion-${s.id}`} className="mb-3 font-display text-[length:var(--forge-text-lg,18px)] font-semibold kit-txt">
              {s.titulo}
            </h2>
            {s.contenido}
          </section>
        ))}
      </div>
    );
  }

  const valor = secciones.some((s) => s.id === activa) ? (activa as string) : secciones[0].id;
  return (
    <Tabs
      className={cn("kit-tema min-w-0", className)}
      variant="pills"
      value={valor}
      onValueChange={setActiva}
      tabs={secciones.map((s) => ({ id: s.id, label: s.titulo, panel: <div className="min-w-0">{s.contenido}</div> }))}
    />
  );
}
