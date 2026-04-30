"use client";

import Link from "next/link";
import type { LegalAgent } from "@/types/legal";
import { cn } from "@/lib/utils";
import { BookOpen, Calendar, FileText, Scale, Shield } from "lucide-react";

function categoryIcon(category: string) {
  const c = category.toLowerCase();
  if (c.includes("riesgo") || c.includes("contract")) return <FileText className="h-6 w-6" />;
  if (c.includes("aml") || c.includes("kyc")) return <Shield className="h-6 w-6" />;
  if (c.includes("plazo") || c.includes("crono")) return <Calendar className="h-6 w-6" />;
  if (c.includes("cita")) return <BookOpen className="h-6 w-6" />;
  return <Scale className="h-6 w-6" />;
}

function criticalityClass(c?: string) {
  switch (c) {
    case "critical":
      return "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200";
    case "high":
      return "bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-100";
    case "medium":
      return "bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-100";
    default:
      return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200";
  }
}

export function LegalAgentCard({ agent }: { agent: LegalAgent }) {
  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-500 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-blue-500">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          {categoryIcon(agent.category)}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold tracking-tight text-slate-900 dark:text-slate-50">{agent.name}</h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">{agent.category}</p>
        </div>
      </div>
      {agent.description && (
        <p className="mt-3 line-clamp-2 text-sm text-slate-600 dark:text-slate-400">{agent.description}</p>
      )}
      <div className="mt-3 flex flex-wrap gap-1">
        {agent.rag_enabled && (
          <span className="rounded bg-blue-50 px-2 py-0.5 text-xs text-blue-800 dark:bg-blue-950 dark:text-blue-200">
            RAG
          </span>
        )}
        {agent.control_plane_enabled && (
          <span className="rounded bg-violet-50 px-2 py-0.5 text-xs text-violet-800 dark:bg-violet-950 dark:text-violet-200">
            Control Plane
          </span>
        )}
        {agent.criticality && (
          <span className={cn("rounded px-2 py-0.5 text-xs font-medium", criticalityClass(agent.criticality))}>
            {agent.criticality}
          </span>
        )}
      </div>
      <div className="mt-auto flex gap-2 pt-4">
        <Link
          href={`/legal/research?agent=${encodeURIComponent(agent.agent_id)}`}
          className="flex-1 rounded-lg bg-blue-600 py-2 text-center text-sm font-medium text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500"
        >
          Probar
        </Link>
        <Link
          href={`/legal/audit?agent=${encodeURIComponent(agent.agent_id)}`}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          Auditoría
        </Link>
      </div>
    </div>
  );
}
