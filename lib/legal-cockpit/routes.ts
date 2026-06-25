// lib/legal-cockpit/routes.ts
// REGLA: no asumir rutas dinámicas. Usar query param si /agents/[id] no existe.

export const LEGAL_ROUTES = {
  home: "/legal",
  guide: "/legal/guide",
  cases: "/legal/cases",
  newCase: "/legal/cases/new",
  audit: "/legal/audit",
  research: "/legal/research",
} as const;

// Ruta segura: /legal/research?agent=<id>
// No existe /legal/agents ni /legal/agents/[id] — se usa research con query param
export function agentHref(agentId: string): string {
  return `${LEGAL_ROUTES.research}?agent=${encodeURIComponent(agentId)}`;
}

export function caseHref(caseId: string, action?: string): string {
  const base = `${LEGAL_ROUTES.cases}/${encodeURIComponent(caseId)}`;
  return action ? `${base}?action=${encodeURIComponent(action)}` : base;
}
