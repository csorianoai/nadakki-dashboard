export const MARKETING_ONBOARDING_FLOW_ID = "marketing_core_v1" as const;
export const MARKETING_ONBOARDING_STORAGE_VERSION = 1 as const;

export type MarketingOnboardingStepId =
  | "welcome"
  | "connect"
  | "goals"
  | "campaign"
  | "agents"
  | "workflow"
  | "notifications"
  | "done";

export type MarketingOnboardingPersisted = {
  version: typeof MARKETING_ONBOARDING_STORAGE_VERSION;
  currentStepIndex: number;
  completedStepIds: MarketingOnboardingStepId[];
  /** Step 3 — selected goal keys */
  goalKeys?: string[];
  /** Step 7 — demo toggles */
  notifyEmail?: boolean;
  notifySlack?: boolean;
  notifyInApp?: boolean;
  updatedAt: string;
};

export const MARKETING_ONBOARDING_STEP_ORDER: MarketingOnboardingStepId[] = [
  "welcome",
  "connect",
  "goals",
  "campaign",
  "agents",
  "workflow",
  "notifications",
  "done",
];
