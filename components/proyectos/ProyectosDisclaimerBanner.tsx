"use client";

import { cn } from "@/lib/utils";

/** CAP-95 — Avisos legales / no asesoría automatizada (placeholder hasta copy legal formal). */
export function ProyectosDisclaimerBanner({
  variant = "default",
  className,
}: {
  variant?: "default" | "compact";
  className?: string;
}) {
  return (
    <aside
      role="note"
      className={cn(
        "rounded-2xl border border-amber-400/35 bg-gradient-to-br from-amber-500/15 to-transparent p-4 text-sm text-amber-50 shadow-lg shadow-amber-500/10 backdrop-blur-sm",
        variant === "compact" && "p-3 text-xs",
        className,
      )}
    >
      <p className="font-semibold">Aviso de uso</p>
      <p className="mt-2 leading-snug opacity-95">
        Esta vista es solo de apoyo operativo sobre datos del Projects Core NADAKKI. No constituye asesoría
        financiera, legal ni de inversión. Los KPIs pueden variar hasta que políticas IAM y pipelines de datos
        queden cerrados por compliance.
      </p>
    </aside>
  );
}
