"use client";

import { useState } from "react";
import { Scale, FileText, ScrollText, Shield, Briefcase, Home, Code, Users, FileSignature } from "lucide-react";
import { useLegalQuickCheck } from "@/hooks/useLegal";
import { DecisionBadge } from "@/components/legal/DecisionBadge";
import { CitationBadge } from "@/components/legal/CitationBadge";
import { AuditTrailCard } from "@/components/legal/AuditTrailCard";
import { LlmModeNotice } from "@/components/legal/LlmModeNotice";
import { PracticeAreaChipGroup } from "@/components/legal/PracticeAreaChipGroup";
import { PracticeAreaFilter } from "@/components/legal/PracticeAreaFilter";

const CONTRACT_TYPES = [
  {
    id: "prestamo",
    label: "Préstamo",
    icon: FileSignature,
    color: "blue",
    prompt: "Analiza este contrato de préstamo. Verifica tasas de interés, cláusula penal, plazos de pago, y garantías. Identifica cláusulas leoninas según la Ley 358-05 de protección al consumidor.\n\n[Pega aquí el contrato]",
  },
  {
    id: "servicio",
    label: "Servicio",
    icon: Briefcase,
    color: "emerald",
    prompt: "Analiza este contrato de prestación de servicios. Revisa obligaciones de las partes, plazos, contraprestación, propiedad intelectual, confidencialidad y causales de terminación.\n\n[Pega aquí el contrato]",
  },
  {
    id: "nda",
    label: "Confidencialidad (NDA)",
    icon: Shield,
    color: "amber",
    prompt: "Analiza este acuerdo de confidencialidad (NDA). Verifica alcance de la información confidencial, duración de obligaciones, excepciones, retorno de información y consecuencias por incumplimiento.\n\n[Pega aquí el contrato]",
  },
  {
    id: "compraventa",
    label: "Compraventa",
    icon: ScrollText,
    color: "purple",
    prompt: "Analiza este contrato de compraventa. Revisa identificación del bien, precio, forma de pago, transferencia de propiedad, garantías y vicios ocultos según el Código Civil.\n\n[Pega aquí el contrato]",
  },
  {
    id: "arrendamiento",
    label: "Arrendamiento",
    icon: Home,
    color: "indigo",
    prompt: "Analiza este contrato de arrendamiento. Revisa duración, canon, ajustes, garantías, obligaciones del arrendador y arrendatario, mejoras y causales de terminación según Ley 4314 sobre Inquilinato en RD.\n\n[Pega aquí el contrato]",
  },
  {
    id: "empleo",
    label: "Empleo",
    icon: Users,
    color: "rose",
    prompt: "Analiza este contrato de trabajo. Verifica cláusulas según el Código de Trabajo (Ley 16-92): jornada, salario, prestaciones, períodos de prueba, causales de terminación, no competencia y confidencialidad.\n\n[Pega aquí el contrato]",
  },
  {
    id: "software",
    label: "Software/SaaS",
    icon: Code,
    color: "cyan",
    prompt: "Analiza este contrato de software o SaaS. Revisa licenciamiento, propiedad intelectual, SLA, datos personales (Ley 172-13), límites de responsabilidad, y términos de soporte.\n\n[Pega aquí el contrato]",
  },
  {
    id: "otro",
    label: "Otro tipo",
    icon: FileText,
    color: "zinc",
    prompt: "Analiza este contrato. Identifica tipo de contrato, partes, objeto, obligaciones principales, cláusulas riesgosas y aspectos de cumplimiento normativo aplicables.\n\n[Pega aquí el contrato]",
  },
] as const;

const COLOR_CLASSES: Record<string, string> = {
  blue: "border-blue-800/50 bg-blue-950/30 hover:bg-blue-900/40",
  emerald: "border-emerald-800/50 bg-emerald-950/30 hover:bg-emerald-900/40",
  amber: "border-amber-800/50 bg-amber-950/30 hover:bg-amber-900/40",
  purple: "border-purple-800/50 bg-purple-950/30 hover:bg-purple-900/40",
  indigo: "border-indigo-800/50 bg-indigo-950/30 hover:bg-indigo-900/40",
  rose: "border-rose-800/50 bg-rose-950/30 hover:bg-rose-900/40",
  cyan: "border-cyan-800/50 bg-cyan-950/30 hover:bg-cyan-900/40",
  zinc: "border-zinc-700 bg-zinc-900 hover:bg-zinc-800/60",
};

const ICON_COLORS: Record<string, string> = {
  blue: "text-blue-400",
  emerald: "text-emerald-400",
  amber: "text-amber-400",
  purple: "text-purple-400",
  indigo: "text-indigo-400",
  rose: "text-rose-400",
  cyan: "text-cyan-400",
  zinc: "text-zinc-400",
};

export default function LegalForgeContractsPage() {
  const [texto, setTexto] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [practiceAreaTags, setPracticeAreaTags] = useState<string[]>(["civil", "bancario"]);
  const { loading, result, submit, tenantMissing } = useLegalQuickCheck();

  const handleAnalyze = async () => {
    if (!texto.trim()) return;
    await submit({
      tipo_solicitud: "contrato_simple",
      texto,
      jurisdiccion: "DO",
      etiquetas_area_practica: practiceAreaTags,
    });
  };

  const handleTypeSelect = (typeId: string, prompt: string) => {
    setSelectedType(typeId);
    setTexto(prompt);
    document.getElementById("contract-textarea")?.focus();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="rounded-xl bg-violet-500/10 p-2.5">
            <Scale className="h-6 w-6 text-violet-400" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-zinc-100">Análisis de contratos con IA</h2>
            <p className="text-sm text-zinc-500">Detección de cláusulas riesgosas, validación legal y análisis de compliance</p>
          </div>
        </div>
      </div>

      {tenantMissing && (
        <p className="rounded-lg border border-amber-700/50 bg-amber-950/30 p-3 text-sm text-amber-200">
          Selecciona un tenant en el selector global para enviar análisis al Legal Core.
        </p>
      )}

      <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-4">
        <p className="mb-2 text-sm font-medium text-zinc-200">Áreas de práctica del análisis</p>
        <PracticeAreaFilter selected={practiceAreaTags} onChange={setPracticeAreaTags} />
      </div>

      {/* Tipos de contratos */}
      {!result && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-300">Selecciona el tipo de contrato (opcional):</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {CONTRACT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleTypeSelect(type.id, type.prompt)}
                  className={`group flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all ${COLOR_CLASSES[type.color]} ${isSelected ? "ring-2 ring-offset-1 ring-offset-zinc-950 ring-violet-500" : ""}`}
                >
                  <Icon className={`h-5 w-5 ${ICON_COLORS[type.color]}`} />
                  <span className="text-sm font-medium text-zinc-100">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Textarea */}
      <div className="space-y-2">
        <label htmlFor="contract-textarea" className="block text-sm font-medium text-zinc-300">
          Texto del contrato
        </label>
        <textarea
          id="contract-textarea"
          className="w-full min-h-[240px] rounded-lg border border-zinc-700 bg-zinc-900 p-3 font-mono text-sm text-zinc-100 shadow-sm transition-colors placeholder:text-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
          placeholder="Pega aquí el texto del contrato a analizar..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <p className="flex items-center gap-1.5 text-xs text-zinc-500">
          <span className="text-violet-400">💡</span>
          <span>Tip: el análisis detecta cláusulas leoninas, riesgos de cumplimiento, y validez según normativa RD.</span>
        </p>
      </div>

      {/* Botón */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleAnalyze()}
          disabled={loading || !texto.trim() || tenantMissing}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          <Scale className="h-4 w-4" />
          {loading ? "Analizando contrato..." : "Analizar contrato"}
        </button>
        {texto.trim() && !loading && (
          <button
            type="button"
            onClick={() => { setTexto(""); setSelectedType(null); }}
            className="text-sm text-zinc-500 underline hover:text-zinc-300"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Resultado */}
      {result && (
        <div className="mt-6 space-y-4 rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow-sm">
          <LlmModeNotice resultado={result} />
          <DecisionBadge decision={result.decision} />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-zinc-400">Áreas enviadas:</span>
            <PracticeAreaChipGroup tags={practiceAreaTags} maxVisible={19} size="sm" />
          </div>
          <p className="text-zinc-300">{result.decision.explicacion}</p>

          {(result.codigos_razon?.length ?? 0) > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-zinc-300">
                {result.codigos_razon!.length} códigos de razón
              </summary>
              <ul className="ml-4 mt-2 space-y-1">
                {result.codigos_razon!.map((c, i) => (
                  <li key={i}>
                    <code className="text-xs">{c.codigo}</code> — {c.descripcion}
                  </li>
                ))}
              </ul>
            </details>
          )}

          {(result.citas?.length ?? 0) > 0 && (
            <div>
              <strong className="text-sm text-zinc-300">Citas:</strong>
              <div className="mt-1 flex flex-wrap gap-1">
                {result.citas!.map((c, i) => (
                  <CitationBadge
                    key={i}
                    citation={c}
                    verified={result.citas_verificadas?.includes(c) ?? false}
                  />
                ))}
              </div>
            </div>
          )}

          <AuditTrailCard trazabilidad={result.trazabilidad_auditoria} />
        </div>
      )}
    </div>
  );
}
