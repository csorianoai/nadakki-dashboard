export const projectsKeys = {
  all: ["projects"] as const,
  proyectos: (tenantId: string) => ["projects", "proyectos", tenantId] as const,
  proyecto: (tenantId: string, proyectoId: string) =>
    ["projects", "proyecto", tenantId, proyectoId] as const,
  health: (tenantId: string) => ["projects", "health", tenantId] as const,
  auditTrail: (tenantId: string, proyectoId: string) =>
    ["projects", "audit-trail", tenantId, proyectoId] as const,
};
