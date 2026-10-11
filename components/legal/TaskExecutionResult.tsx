"use client";

import { AttorneyReviewBadge } from "@/components/legal/AttorneyReviewBadge";
import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";

type Props = {
  data: Record<string, unknown> | null;
  /** L2a: lo que el panel envió como dry_run. El backend no lo devuelve. */
  dryRun?: boolean;
};

type Decision = { explicacion?: unknown; siguientes_pasos?: unknown };

/** L2a: resumen legible del sealed_output; nunca el JSON crudo. */
export function TaskExecutionResult({ data, dryRun = true }: Props) {
  const m = useLegalHomeMessages();
  const sealed = (data?.sealed_output ?? {}) as { estado?: unknown; decision?: Decision };
  const failed = sealed.estado === "error";
  const decision = sealed.decision ?? {};
  const explicacion = typeof decision.explicacion === "string" ? decision.explicacion : "";
  const pasos = Array.isArray(decision.siguientes_pasos)
    ? decision.siguientes_pasos.filter((p): p is string => typeof p === "string" && p.trim() !== "")
    : [];

  return (
    <div className="mt-4 space-y-3 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken p-4">
      <p className="text-forge-sm font-semibold text-forge-text">{m.sealed_output_label}</p>
      <p
        role="status"
        data-testid="task-run-mode"
        className="rounded-forge-sm border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900"
      >
        {dryRun
          ? "Simulación: la tarea se ejecutó en modo de prueba y no se guardó ningún resultado."
          : "Ejecución real: el resultado quedó registrado."}
      </p>
      {failed ? (
        <p role="alert" className="text-forge-sm text-forge-text">
          La tarea no se completó. Revisa los datos e inténtalo de nuevo.
        </p>
      ) : (
        <>
          <p className="text-forge-sm text-forge-text">{explicacion || "La tarea no devolvió un resumen."}</p>
          {pasos.length > 0 ? (
            <ul className="list-disc space-y-1 pl-5 text-xs text-forge-text">
              {pasos.map((p, i) => (
                <li key={i}>{p}</li>
              ))}
            </ul>
          ) : null}
        </>
      )}
      <AttorneyReviewBadge variant="full" />
    </div>
  );
}
