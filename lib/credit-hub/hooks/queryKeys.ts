export const chKeys = {
  health: () => ["credit-hub", "health"] as const,
  applications: (tenantId: string) =>
    ["credit-hub", "applications", tenantId] as const,
  application: (tenantId: string, applicationId: string) =>
    ["credit-hub", "application", tenantId, applicationId] as const,
};
