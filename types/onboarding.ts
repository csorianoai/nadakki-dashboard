/** Tenant onboarding wizard (Phase B — admin console). */

export type CountryCode = "DO" | "CO" | "MX";

export type Industry =
  | "financial_services"
  | "tourism"
  | "retail"
  | "automotive"
  | "technology"
  | "other";

export type CoreKind = "credit" | "marketing" | "legal" | "billing";

export type PricingTier = "starter" | "pro" | "enterprise";

export interface CoreSelection {
  core: CoreKind;
  tier: PricingTier;
}

export type UserRole = "tenant_admin" | "analyst" | "viewer" | "support";

export interface OnboardingUser {
  email: string;
  fullName: string;
  role: UserRole;
}

/** Bank credential row (E2E synthetic — never store real secrets in drafts). */
export interface BankCredentialRow {
  bankId: string;
  bankName: string;
  clientId: string;
  clientSecret: string;
}

export interface TenantOnboardingState {
  /** Provisional id returned by draft API (for logo upload paths). */
  provisionalTenantId: string | null;
  step1: {
    slug: string;
    displayName: string;
    country: CountryCode;
    industry: Industry;
    contactEmail: string;
  };
  step2: {
    logoFileName: string | null;
    logoDataUrl: string | null;
    primaryColor: string;
    secondaryColor: string;
    customDomain: string;
  };
  step3: {
    cores: CoreSelection[];
  };
  step4: {
    admin: OnboardingUser;
    additionalUsers: OnboardingUser[];
  };
  step5: {
    bankCredentials: BankCredentialRow[];
  };
}

export type OnboardingStepNumber = 1 | 2 | 3 | 4 | 5 | 6;

export interface OnboardingDraftResponse {
  tenant_id?: string;
  draft_id?: string;
  updated_at?: string;
}

export interface OnboardingActivateResponse {
  tenant_id?: string;
  status?: string;
  provisional_access_until?: string;
  estimated_monthly_usd?: number;
}
