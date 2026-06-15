"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DecisionPanelProps } from "@/lib/credit-hub/ch-types";

export function DecisionPanel({
  state,
  title = "Decisión crediticia",
  description = "Revise el análisis y registre una decisión auditable.",
  conflictMessage = "Otro analista reclamó esta solicitud.",
  onApprove,
  onReject,
  onCounter,
  loadingLabel = "Registrando decisión…",
  className,
}: DecisionPanelProps) {
  return (
    <section className={cn("ch-card p-4", className)} aria-live="polite" aria-busy={state === "loading"}>
      <h2 className="text-sm font-semibold" style={{ color: "var(--ch-ink)" }}>
        {title}
      </h2>
      <p className="mt-1 text-sm" style={{ color: "var(--ch-ink-3)" }}>
        {description}
      </p>

      {state === "loading" ? (
        <div className="mt-4 flex items-center gap-2 text-sm" style={{ color: "var(--ch-ink-2)" }}>
          <Loader2 className="h-4 w-4 animate-spin motion-reduce:animate-none" aria-hidden />
          {loadingLabel}
        </div>
      ) : null}

      {state === "error" ? (
        <p className="mt-4 text-sm" style={{ color: "var(--ch-neg)" }}>
          No se pudo registrar la decisión. Intente de nuevo.
        </p>
      ) : null}

      {state === "conflict" ? (
        <div className="mt-4 flex items-start gap-2 rounded-[var(--ch-r)] p-3" style={{ background: "var(--ch-warn-soft)" }}>
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" style={{ color: "var(--ch-warn)" }} aria-hidden />
          <p className="text-sm" style={{ color: "var(--ch-ink-2)" }}>
            {conflictMessage}
          </p>
        </div>
      ) : null}

      {state === "success" ? (
        <p className="mt-4 text-sm font-medium" style={{ color: "var(--ch-pos)" }}>
          Decisión registrada correctamente.
        </p>
      ) : null}

      {state === "idle" || state === "error" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" className="ch-btn ch-btn-primary" onClick={onApprove}>
            Aprobar
          </button>
          <button type="button" className="ch-btn ch-btn-secondary" onClick={onCounter}>
            Contra-oferta
          </button>
          <button type="button" className="ch-btn ch-btn-secondary" onClick={onReject}>
            Rechazar
          </button>
        </div>
      ) : null}
    </section>
  );
}
