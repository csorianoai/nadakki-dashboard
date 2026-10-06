import type { ReactNode } from "react";

/** Codigos y detalle para soporte: plegado, el usuario del dealer no lo necesita para actuar. */
export function DetalleTecnico({ children }: { children: ReactNode }) {
  return (
    <details className="mt-1 text-xs text-nk-fg-muted">
      <summary className="cursor-pointer">Detalle técnico</summary>
      {children}
    </details>
  );
}
