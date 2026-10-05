"use client";

import { useId, type ReactNode } from "react";

/** Rotulos tecnicos (metric_key, policy) fuera de la vista: `title` + descripcion para lector de pantalla. */
export function DccTooltip({ contenido, children }: { contenido: string | null | undefined; children: ReactNode }) {
  const id = useId();
  const texto = contenido?.trim();
  if (!texto) return <>{children}</>;
  return (
    <span title={texto} aria-describedby={id} data-testid="dcc-tooltip" className="inline-flex">
      {children}
      <span id={id} className="sr-only">
        {texto}
      </span>
    </span>
  );
}
