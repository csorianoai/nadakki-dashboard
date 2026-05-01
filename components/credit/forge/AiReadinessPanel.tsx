"use client";

import { Brain, FileCheck, Shield } from "lucide-react";

const TIPS: Record<number, { title: string; body: string }> = {
  0: {
    title: "Crear expediente",
    body: "Se generará un ID único en estado DRAFT. Todo queda auditado por tenant.",
  },
  1: {
    title: "Perfil del solicitante",
    body: "Datos estructurados alimentan scoring, capacidad de pago y cumplimiento Ley 172-13.",
  },
  2: {
    title: "Colateral vehicular",
    body: "LTV y valor de mercado condicionan la recomendación IA y el paquete bancario.",
  },
  3: {
    title: "Documentación",
    body: "Completeza documental reduce fricción en mesa bancaria y acelera stipulations.",
  },
  4: {
    title: "Evaluación",
    body: "El motor orquesta modo seleccionado (IA / banco / híbrido) con trazabilidad de eventos.",
  },
};

export function AiReadinessPanel({ stepIndex }: { stepIndex: number }) {
  const tip = TIPS[stepIndex] ?? TIPS[0];
  return (
    <aside className="space-y-4 rounded-2xl border border-violet-500/20 bg-gradient-to-b from-violet-950/40 to-slate-950/80 p-5 ring-1 ring-white/5">
      <div className="flex items-center gap-2 text-violet-200">
        <Brain className="h-5 w-5 shrink-0" aria-hidden />
        <p className="text-xs font-semibold uppercase tracking-widest">AI readiness</p>
      </div>
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-slate-50">{tip.title}</h3>
        <p className="text-xs leading-relaxed text-slate-400">{tip.body}</p>
      </div>
      <ul className="space-y-2 border-t border-white/10 pt-4 text-[11px] text-slate-500">
        <li className="flex gap-2">
          <Shield className="h-3.5 w-3.5 shrink-0 text-emerald-400/80" aria-hidden />
          Multi-tenant estricto: cabecera X-Tenant-ID en cada llamada.
        </li>
        <li className="flex gap-2">
          <FileCheck className="h-3.5 w-3.5 shrink-0 text-sky-400/80" aria-hidden />
          Sin datos simulados: estados vacíos se muestran con honestidad operativa.
        </li>
      </ul>
    </aside>
  );
}
