/** Autos dealer core access — entitlement types (Phase 1 frontend). */

export type PlanSlug = "conecta" | "crece" | "domina";

export type EntitlementReasonCode =
  | "ALLOWED"
  | "UPGRADE_REQUIRED"
  | "LIMIT_REACHED"
  | "TENANT_NOT_FOUND"
  | "NO_ACTIVE_SUBSCRIPTION"
  | "GRACE_PERIOD_RESTRICTION"
  | "CAPABILITY_DISABLED_BY_OVERRIDE"
  | "ADD_ON_REQUIRED"
  | "PROVIDER_ACTIVATION_REQUIRED"
  | "TARGET_CORE_NOT_READY"
  | "FEATURE_NOT_RELEASED"
  | "ROLE_NOT_ALLOWED"
  | "DEFAULT_DENY";

export type TargetReadiness = "LIVE" | "BLOCKED" | "BETA" | "DEPRECATED";

export type ProviderStatus = "ACTIVE" | "PENDING" | "FAILED";

export interface EntitlementDecision {
  allowed: boolean;
  reason_code: EntitlementReasonCode;
  product?: string;
  plan_slug?: PlanSlug;
  plan_version?: number;
  entitlement_source?: "plan" | "add_on" | "override";
  limit?: number;
  used?: number;
  remaining?: number;
  upgrade_options?: UpgradeOption[];
  target_readiness?: TargetReadiness;
  provider_status?: ProviderStatus;
}

export interface UpgradeOption {
  plan_slug: PlanSlug;
  price_usd_cents: number;
  includes: string[];
  features_unlocked: string[];
}

export interface EntitlementCheck {
  capability_id: string;
  resource_id?: string;
  requested_units?: number;
}

export interface ReasonCodeInfo {
  code: string;
  title: string;
  description: string;
  user_friendly_message: string;
  action_required?: string;
  icon?: "lock" | "upgrade" | "alert" | "info" | "clock";
}

export const REASON_CODE_INFO: Record<string, ReasonCodeInfo> = {
  ALLOWED: {
    code: "ALLOWED",
    title: "Access Granted",
    description: "You have access to this capability.",
    user_friendly_message: "You can proceed.",
    icon: "info",
  },
  UPGRADE_REQUIRED: {
    code: "UPGRADE_REQUIRED",
    title: "Upgrade Your Plan",
    description: "This capability requires a higher-tier plan.",
    user_friendly_message: "Upgrade to Crece or Domina to access this.",
    action_required: "upgrade_plan",
    icon: "upgrade",
  },
  LIMIT_REACHED: {
    code: "LIMIT_REACHED",
    title: "Monthly Limit Reached",
    description: "You've reached your monthly limit for this capability.",
    user_friendly_message: "Your monthly limit is reached. Upgrade or wait for next month.",
    action_required: "wait_or_upgrade",
    icon: "alert",
  },
  ADD_ON_REQUIRED: {
    code: "ADD_ON_REQUIRED",
    title: "Add-On Required",
    description: "This capability is available as an add-on.",
    user_friendly_message: "Enable this add-on in your plan.",
    action_required: "enable_addon",
    icon: "upgrade",
  },
  PROVIDER_ACTIVATION_REQUIRED: {
    code: "PROVIDER_ACTIVATION_REQUIRED",
    title: "Provider Not Activated",
    description: "This core's external provider needs activation.",
    user_friendly_message: "Admin must activate this provider first.",
    action_required: "contact_admin",
    icon: "lock",
  },
  TARGET_CORE_NOT_READY: {
    code: "TARGET_CORE_NOT_READY",
    title: "Feature Not Yet Available",
    description: "This capability is not yet available.",
    user_friendly_message: "This feature is coming soon.",
    icon: "clock",
  },
  DEFAULT_DENY: {
    code: "DEFAULT_DENY",
    title: "Access Denied",
    description: "This capability is not available.",
    user_friendly_message: "Sign in or upgrade your plan to continue.",
    icon: "lock",
  },
};

export interface CapabilityInfo {
  capability_id: string;
  product: string;
  domain: string;
  description: string;
  risk_level: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  requires_external_provider: boolean;
  target_core?: string;
  default_access: boolean;
  status: "DRAFT" | "ACTIVE" | "DEPRECATED" | "BLOCKED";
}

export interface PlanInfo {
  plan_slug: PlanSlug;
  plan_version: number;
  display_name: string;
  price_usd_cents: number;
  capabilities: CapabilityAccess[];
  limits: Record<string, number>;
  description: string;
}

export interface CapabilityAccess {
  capability_id: string;
  included: boolean;
  limit?: number;
  meter_type?: "monthly" | "annual" | "unlimited";
}

export interface DealerEntitlementContext {
  tenant_id: string;
  plan_slug: PlanSlug;
  plan_version: number;
  subscription_status: "ACTIVE" | "PAST_DUE" | "SUSPENDED";
  capabilities: Record<string, EntitlementDecision>;
  usage: Record<string, { used: number; limit: number | null }>;
  add_ons: string[];
  overrides: DealerOverride[];
}

export interface DealerOverride {
  capability_id: string;
  operation: "ENABLE" | "DISABLE" | "SET_LIMIT" | "UNLIMITED";
  value?: unknown;
  reason: string;
  expires_at?: string;
}
