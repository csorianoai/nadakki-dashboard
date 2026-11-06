"use client";

import { Sparkles } from "lucide-react";
import { ContablePageShell } from "@/components/contable/ContablePageShell";

/**
 * El backend no tiene /reports/sugerencias-ia (0 rutas, backend#2548): no se
 * llama y no se muestra ningun analisis inventado.
 */
export function AgenteFinancieroClient() {
  return (
    <ContablePageShell
      title="Consultor Financiero IA"
      description="Análisis inteligente de tus finanzas con sugerencias accionables."
      icon={<Sparkles className="h-10 w-10" aria-hidden />}
    >
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Sparkles className="mb-3 h-10 w-10 text-zinc-600" aria-hidden />
        <p className="text-sm text-zinc-400">Consultor IA no disponible.</p>
        <p className="mt-1 text-xs text-zinc-500">
          Esta función aún no está habilitada en tu cuenta.
        </p>
      </div>
    </ContablePageShell>
  );
}
