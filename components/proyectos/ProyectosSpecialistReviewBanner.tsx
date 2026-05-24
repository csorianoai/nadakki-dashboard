"use client";

import { cn } from "@/lib/utils";

/** CAP-95 — Recordatorio revisión especialista/humano en ciclo antes de ejecutar decisión institucional. */
export function ProyectosSpecialistReviewBanner({
  variant = "default",
  className,
}: {
  variant?: "default" | "compact";
  className?: string;
}) {
  return (
    <aside
      role="status"
      className={cn(
        "rounded-2xl border border-sky-400/30 bg-gradient-to-br from-sky-500/15 to-cyan-500/10 p-4 text-sm text-sky-50 shadow-lg backdrop-blur-sm",
        variant === "compact" && "p-3 text-xs",
        className,
      )}
    >
      <p className="font-semibold">Revisión especialista recomendada</p>
      <p className="mt-2 leading-snug opacity-95">
        Antes de basar políticas ejecutivas sobre estos datos confirman PMO/Riesgos/Legal el estado del pipeline IA y
        el sellado auditado en producción. Los agentes NADAKKI enriquecen, pero las decisiones finalistas permanecen
        human-in-the-loop.
      </p>
    </aside>
  );
}
