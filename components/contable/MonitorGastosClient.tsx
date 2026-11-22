"use client";

import { AlertTriangle } from "lucide-react";
import { ContablePageShell } from "@/components/contable/ContablePageShell";

/**
 * El backend no tiene /reports/gastos-monitor (0 rutas, backend#2548): no se
 * llama y no se muestra ningun dato inventado.
 */
export function MonitorGastosClient() {
  return (
    <ContablePageShell
      title="Monitor de Gastos"
      description="Seguimiento de gastos con alertas de variación vs período anterior."
      icon={<AlertTriangle className="h-10 w-10" aria-hidden />}
    >
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <p className="text-sm text-zinc-400">Monitor de gastos no disponible.</p>
        <p className="mt-1 text-xs text-zinc-500">
          Esta función aún no está habilitada en tu cuenta.
        </p>
      </div>
    </ContablePageShell>
  );
}
