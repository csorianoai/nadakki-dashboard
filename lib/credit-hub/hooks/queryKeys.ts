export const chKeys = {
  health: () => ["credit-hub", "health"] as const,
  applications: (tenantId: string) =>
    ["credit-hub", "applications", tenantId] as const,
  application: (tenantId: string, applicationId: string) =>
    ["credit-hub", "application", tenantId, applicationId] as const,
  creditCoreHealth: (tenantId: string) =>
    ["credit-hub", "credit-core", "health", tenantId] as const,
  creditCoreStats: (tenantId: string) =>
    ["credit-hub", "credit-core", "stats", tenantId] as const,
  creditCoreApplications: (tenantId: string) =>
    ["credit-hub", "credit-core", "applications", tenantId] as const,
  creditCoreApplication: (tenantId: string, applicationId: string) =>
    ["credit-hub", "credit-core", "application", tenantId, applicationId] as const,
  creditCoreEvents: (tenantId: string, applicationId: string) =>
    ["credit-hub", "credit-core", "events", tenantId, applicationId] as const,
  creditCoreOffers: (tenantId: string, applicationId: string) =>
    ["credit-hub", "credit-core", "offers", tenantId, applicationId] as const,
  creditAnalysis: (tenantId: string, applicationId: string) =>
    ["credit-hub", "credit-core", "analysis", tenantId, applicationId] as const,
  bankQueue: (
    tenantId: string,
    query?: { limit?: number; offset?: number; filters?: Record<string, string> }
  ) => ["credit-hub", "bank", "queue", tenantId, query ?? null] as const,
  bankApplication: (tenantId: string, applicationId: string) =>
    ["credit-hub", "bank", "application", tenantId, applicationId] as const,
  bankAnalytics: (tenantId: string, period = "30d") =>
    ["credit-hub", "bank", "analytics", tenantId, period] as const,
  bankAuditTrail: (tenantId: string, applicationId: string) =>
    ["credit-hub", "bank", "audit-trail", tenantId, applicationId] as const,
  bankCompliance: (tenantId: string, applicationId: string) =>
    ["credit-hub", "bank", "compliance", tenantId, applicationId] as const,
  banksRanking: (tenantId: string) =>
    ["credit-hub", "analytics", "banks-ranking", tenantId] as const,
  riskDistributions: (tenantId: string) =>
    ["credit-hub", "analytics", "risk-distributions", tenantId] as const,
  auctionIntel: (tenantId: string, lenderCode?: string | null) =>
    ["credit-hub", "analytics", "auction-intel", tenantId, lenderCode ?? null] as const,
  dashboardSummary: (tenantId: string) =>
    ["credit-hub", "dashboard-summary", tenantId] as const,
};
