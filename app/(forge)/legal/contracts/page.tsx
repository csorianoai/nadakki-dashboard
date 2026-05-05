"use client";

import { useState } from "react";
import { Scale, FileText, ScrollText, Shield, Briefcase, Home, Code, Users, FileSignature } from "lucide-react";
import { useLegalQuickCheck } from "@/hooks/useLegal";
import { DecisionBadge } from "@/components/legal/DecisionBadge";
import { CitationBadge } from "@/components/legal/CitationBadge";
import { AuditTrailCard } from "@/components/legal/AuditTrailCard";
import { LlmModeNotice } from "@/components/legal/LlmModeNotice";

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
    color: "slate",
    prompt: "Analiza este contrato. Identifica tipo de contrato, partes, objeto, obligaciones principales, cláusulas riesgosas y aspectos de cumplimiento normativo aplicables.\n\n[Pega aquí el contrato]",
  },
] as const;

const COLOR_CLASSES: Record<string, string> = {
  blue: "border-blue-200 bg-blue-50 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30",
  emerald: "border-emerald-200 bg-emerald-50 hover:bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-950/30",
  amber: "border-amber-200 bg-amber-50 hover:bg-amber-100 dark:border-amber-800 dark:bg-amber-950/30",
  purple: "border-purple-200 bg-purple-50 hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-950/30",
  indigo: "border-indigo-200 bg-indigo-50 hover:bg-indigo-100 dark:border-indigo-800 dark:bg-indigo-950/30",
  rose: "border-rose-200 bg-rose-50 hover:bg-rose-100 dark:border-rose-800 dark:bg-rose-950/30",
  cyan: "border-cyan-200 bg-cyan-50 hover:bg-cyan-100 dark:border-cyan-800 dark:bg-cyan-950/30",
  slate: "border-slate-200 bg-slate-50 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900",
};

const ICON_COLORS: Record<string, string> = {
  blue: "text-blue-600 dark:text-blue-400",
  emerald: "text-emerald-600 dark:text-emerald-400",
  amber: "text-amber-600 dark:text-amber-400",
  purple: "text-purple-600 dark:text-purple-400",
  indigo: "text-indigo-600 dark:text-indigo-400",
  rose: "text-rose-600 dark:text-rose-400",
  cyan: "text-cyan-600 dark:text-cyan-400",
  slate: "text-slate-600 dark:text-slate-400",
};

export default function LegalForgeContractsPage() {
  const [texto, setTexto] = useState("");
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const { loading, result, submit, tenantMissing } = useLegalQuickCheck();

  const handleAnalyze = async () => {
    if (!texto.trim()) return;
    await submit({
      tipo_solicitud: "contrato_simple",
      texto,
      jurisdiccion: "DO",
      etiquetas_area_practica: ["civil", "bancario"],
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
          <div className="rounded-xl bg-blue-50 p-2.5 dark:bg-blue-950/50">
            <Scale className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-50">Análisis de contratos con IA</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Detección de cláusulas riesgosas, validación legal y análisis de compliance</p>
          </div>
        </div>
      </div>

      {tenantMissing && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
          Selecciona un tenant en el selector global para enviar análisis al Legal Core.
        </p>
      )}

      {/* Tipos de contratos */}
      {!result && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Selecciona el tipo de contrato (opcional):</p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-4">
            {CONTRACT_TYPES.map((type) => {
              const Icon = type.icon;
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => handleTypeSelect(type.id, type.prompt)}
                  className={`group flex flex-col items-start gap-2 rounded-lg border p-3 text-left transition-all ${COLOR_CLASSES[type.color]} ${isSelected ? "ring-2 ring-offset-1 ring-blue-500" : ""}`}
                >
                  <Icon className={`h-5 w-5 ${ICON_COLORS[type.color]}`} />
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Textarea */}
      <div className="space-y-2">
        <label htmlFor="contract-textarea" className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          Texto del contrato
        </label>
        <textarea
          id="contract-textarea"
          className="w-full min-h-[240px] rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-900 dark:focus:ring-blue-900"
          placeholder="Pega aquí el texto del contrato a analizar..."
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <p className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <span className="text-blue-500">💡</span>
          <span>Tip: el análisis detecta cláusulas leoninas, riesgos de cumplimiento, y validez según normativa RD.</span>
        </p>
      </div>

      {/* Botón */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => void handleAnalyze()}
          disabled={loading || !texto.trim() || tenantMissing}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:from-blue-700 hover:to-blue-800 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
        >
          <Scale className="h-4 w-4" />
          {loading ? "Analizando contrato..." : "Analizar contrato"}
        </button>
        {texto.trim() && !loading && (
          <button
            type="button"
            onClick={() => { setTexto(""); setSelectedType(null); }}
            className="text-sm text-slate-500 underline hover:text-slate-700 dark:hover:text-slate-300"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Resultado */}
      {result && (
        <div className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <LlmModeNotice resultado={result} />
          <DecisionBadge decision={result.decision} />
          <p className="text-slate-700 dark:text-slate-300">{result.decision.explicacion}</p>

          {(result.codigos_razon?.length ?? 0) > 0 && (
            <details className="text-sm">
              <summary className="cursor-pointer font-medium text-slate-700 dark:text-slate-300">
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
              <strong className="text-sm text-slate-700 dark:text-slate-300">Citas:</strong>
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