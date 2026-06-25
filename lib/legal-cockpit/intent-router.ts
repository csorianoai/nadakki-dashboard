// lib/legal-cockpit/intent-router.ts

import { agentHref } from "./routes";

type IntentRule = {
  keywords: string[];
  actionKey: string;
  agentId: string;
};

const RULES: IntentRule[] = [
  {
    keywords: ["prescripci", "plazo", "vencimiento", "834", "término procesal"],
    actionKey: "calculate_deadline",
    agentId: "calculador_plazos_procesales",
  },
  {
    keywords: ["contrato", "arrendamiento", "compraventa", "cláusula", "hipoteca"],
    actionKey: "analyze_contract",
    agentId: "analizador_contratos",
  },
  {
    keywords: ["aml", "kyc", "lavado", "155-17", "uafd", "blanqueo"],
    actionKey: "aml_kyc",
    agentId: "validador_amlkyc",
  },
  {
    keywords: ["jurisprudencia", "precedente", "sentencia", "scj"],
    actionKey: "research_case_law",
    agentId: "analizador_jurisprudencia",
  },
  {
    keywords: ["demanda", "contestaci", "apelaci", "escrito", "recurso"],
    actionKey: "draft_legal_document",
    agentId: "redactor_escritos",
  },
  {
    keywords: ["poder", "notarial", "mandato"],
    actionKey: "verify_power",
    agentId: "analizador_contratos",
  },
  {
    keywords: ["riesgo", "clausula", "análisis contractual"],
    actionKey: "analyze_risk",
    agentId: "analizador_contratos",
  },
  {
    keywords: ["estrategia", "litigio", "proceso", "defensa"],
    actionKey: "litigation_strategy",
    agentId: "agente_estrategia_litigiosa",
  },
];

export type IntentMatch =
  | { found: true; actionKey: string; agentId: string; href: string }
  | { found: false };

export function detectIntent(query: string): IntentMatch {
  const lower = query.toLowerCase();
  for (const rule of RULES) {
    if (rule.keywords.some((kw) => lower.includes(kw))) {
      return {
        found: true,
        actionKey: rule.actionKey,
        agentId: rule.agentId,
        href: agentHref(rule.agentId),
      };
    }
  }
  return { found: false };
}

export function getSuggestions(partial: string): string[] {
  if (partial.length < 2) return [];
  const lower = partial.toLowerCase();
  const results: string[] = [];
  for (const rule of RULES) {
    for (const kw of rule.keywords) {
      if (kw.includes(lower) && !results.includes(kw)) {
        results.push(kw);
        if (results.length >= 5) return results;
      }
    }
  }
  return results;
}

export function actionKeyToHref(actionKey: string): string {
  const rule = RULES.find((r) => r.actionKey === actionKey);
  return rule ? agentHref(rule.agentId) : "/legal/research";
}
