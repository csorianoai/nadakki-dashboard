/** Autos Portal admin UI types (aligned with OpenAPI autos-portal-admin). */

export type VehicleModerationAction = "approved" | "rejected" | "flagged" | "pending_review";

export type VehicleModerationStatus = "PENDING" | "FLAGGED" | "APPROVED" | "REJECTED";

export interface AdminVehicleRow {
  id: string;
  tenant_id: string;
  name: string;
  price: number;
  image_url: string;
  dealer_id: string;
  dealer_name?: string;
  status: VehicleModerationStatus;
  created_at: string;
  year?: number;
  km?: number;
  fuel?: string;
  trans?: string;
}

export type DealerKycStatus = "pending" | "verified" | "rejected" | "suspended";

export interface AdminDealerRow {
  id: string;
  tenant_id: string;
  name: string;
  email: string;
  kyc_status: DealerKycStatus;
  created_at: string;
}

export type AutosFeatureFlagKey = "financing" | "compare" | "share" | "leads";

export type AutosFeatureFlags = Record<AutosFeatureFlagKey, boolean>;

export interface CommissionRow {
  lead_id: string;
  vehicle_name: string;
  dealer_id: string;
  requested_amount: number;
  commission_amount: number;
  created_at: string;
}

export interface VehicleModerateRequest {
  action: VehicleModerationAction;
  reason?: string | null;
}

export interface DealerVerifyRequest {
  new_status: DealerKycStatus;
  reason?: string | null;
}

export const AUTOS_FEATURE_FLAG_KEYS: AutosFeatureFlagKey[] = [
  "financing",
  "compare",
  "share",
  "leads",
];

export const DEFAULT_AUTOS_FEATURE_FLAGS: AutosFeatureFlags = {
  financing: true,
  compare: true,
  share: true,
  leads: true,
};

export const COMMISSION_RATE = 0.03;
