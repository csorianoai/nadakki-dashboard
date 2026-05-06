import type { LegalTask } from "./task-types";

export type TenantFeatureKey =
  | "aiGeneration"
  | "abTesting"
  | "advancedAnalytics"
  | "whatsapp"
  | "sms";

/**
 * Returns true when the tenant satisfies all feature codes required by the task.
 * Unknown codes are treated as satisfied to avoid blocking production unexpectedly.
 */
export function tenantSatisfiesTaskFeatures(
  task: LegalTask,
  isFeatureEnabled: (feature: TenantFeatureKey) => boolean
): boolean {
  for (const code of task.tenant_features_required ?? []) {
    if (code === "contract_review" && !isFeatureEnabled("aiGeneration")) {
      return false;
    }
  }
  return true;
}
