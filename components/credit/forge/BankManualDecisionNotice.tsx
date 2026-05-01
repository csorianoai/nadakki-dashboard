"use client";

import Link from "next/link";
import { AlertCircle } from "lucide-react";

/**
 * Honest UX: bank POST /decide is available in Forge Credit Hub client, not yet wired in this Core route.
 */
export function BankManualDecisionNotice({ applicationId }: { applicationId: string }) {
  const forgeHref = `/credit-hub/bank/applications/${encodeURIComponent(applicationId)}`;
  return (
    <div
      role="status"
      className="flex gap-4 rounded-2xl border border-amber-500/25 bg-amber-950/30 p-5 text-sm text-amber-100/90 ring-1 ring-amber-400/15"
    >
      <AlertCircle className="h-5 w-5 shrink-0 text-amber-400" aria-hidden />
      <div className="space-y-2">
        <p className="font-semibold text-amber-50">Decisión bancaria formal</p>
        <p className="leading-relaxed text-amber-100/85">
          El registro de decisión institucional (aprobar / condicionar / rechazar con auditoría) no está integrado aún en esta
          vista de Credit Core. Puede continuar el flujo en Forge Credit Hub, donde sí existe el panel de decisión conectado al
          API.
        </p>
        <Link
          href={forgeHref}
          className="inline-flex text-sm font-medium text-amber-200 underline-offset-4 hover:text-white hover:underline"
        >
          Abrir en Forge Credit Hub →
        </Link>
      </div>
    </div>
  );
}
