"use client";

import { Sparkles } from "lucide-react";

const TOPICS = [
  ["Penal", "Plazos de prescripción para delitos financieros en RD"],
  ["Civil", "Requisitos para demanda en responsabilidad civil extracontractual"],
  ["Laboral", "Cálculo de prestaciones laborales por desahucio del empleador"],
  ["Comercial", "Requisitos de constitución de una SRL según Ley 479-08"],
  ["Contratos", "Validez de cláusula penal del 50% en contrato de préstamo"],
  ["Inmobiliario", "Proceso de saneamiento de título de propiedad inmobiliaria"],
  ["Compliance", "Obligaciones AML/KYC para entidades financieras según Ley 155-17"],
  ["Tributario", "Régimen de facturación electrónica y deberes del contribuyente"],
] as const;

type Props = {
  onPickPrompt: (text: string) => void;
};

export function EmptyWelcome({ onPickPrompt }: Props) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="rounded-full border border-[var(--legal-accent-strong)]/30 bg-[var(--legal-accent-strong)]/10 p-4">
        <Sparkles className="h-8 w-8 text-[var(--legal-accent)]" aria-hidden />
      </div>
      <div className="max-w-lg text-center">
        <h2 className="text-xl font-semibold tracking-tight text-zinc-100">Consulta legal con IA</h2>
        <p className="mt-2 text-sm text-[var(--legal-text-secondary)]">
          Respuestas con trazabilidad normativa (Capa 1 / Capa 2). Seleccione un tema o escriba su consulta.
        </p>
      </div>
      <div className="grid w-full max-w-3xl grid-cols-2 gap-2 sm:grid-cols-4">
        {TOPICS.map(([area, prompt]) => (
          <button
            key={area}
            type="button"
            className="group rounded-lg border border-[var(--legal-border)] bg-[var(--legal-surface-1)] p-3 text-left transition hover:border-[var(--legal-accent-strong)] hover:bg-[var(--legal-surface-2)]"
            onClick={() => {
              onPickPrompt(prompt);
              document.getElementById("legal-research-input")?.focus();
            }}
          >
            <span className="text-xs font-semibold text-[var(--legal-accent)]">{area}</span>
            <p className="mt-1 line-clamp-2 text-xs text-[var(--legal-text-secondary)]">{prompt}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
