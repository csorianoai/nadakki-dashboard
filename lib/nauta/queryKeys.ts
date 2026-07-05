export const nautaKeys = {
  employees: (tenantId: string) => ["nauta", "employees", tenantId] as const,
  templates: (tenantId: string) => ["nauta", "templates", tenantId] as const,
  runs: (tenantId: string, page: number, limit: number) =>
    ["nauta", "runs", tenantId, page, limit] as const,
  run: (tenantId: string, runId: string) => ["nauta", "run", tenantId, runId] as const,
  evidence: (tenantId: string, runId: string) => ["nauta", "evidence", tenantId, runId] as const,
  health: (tenantId: string) => ["nauta", "health", tenantId] as const,
};
