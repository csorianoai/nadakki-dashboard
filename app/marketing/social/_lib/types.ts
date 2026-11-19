/** Tipos del contrato congelado C-SOCIAL-D0 (docs/contracts/C-SOCIAL-D0/schema.json en nadakki-ai-suite). */

export const PLATFORMS = ["instagram", "facebook", "tiktok", "youtube", "linkedin"] as const;
export type Platform = (typeof PLATFORMS)[number];

export type AccountKind =
  | "facebook_page"
  | "instagram_professional"
  | "tiktok_account"
  | "youtube_channel"
  | "linkedin_page"
  | "linkedin_member";

/** Tipo de presencia por defecto para cada plataforma al planificar una ficha. */
export const DEFAULT_KIND: Record<Platform, AccountKind> = {
  instagram: "instagram_professional",
  facebook: "facebook_page",
  tiktok: "tiktok_account",
  youtube: "youtube_channel",
  linkedin: "linkedin_page",
};

export const LIFECYCLE = [
  "PLANNED", "EXISTS", "CLAIMED", "PROFILE_COMPLETE", "CONNECTED",
  "APPROVED", "READY_TO_PUBLISH", "ACTIVE", "ERROR", "REVOKED",
] as const;
export type LifecycleStatus = (typeof LIFECYCLE)[number];
export interface Brand {
  id: string;
  tenant_id: string;
  slug: string;
  display_name: string;
  kind: "personal" | "commercial" | "other";
  status: string;
  version: number;
}
export interface ProfileChecklist {
  photo?: boolean;
  cover?: boolean;
  bio?: boolean;
  website_url?: boolean;
  two_factor?: boolean;
  owner_confirmed?: boolean;
}
export interface SocialAccount {
  id: string;
  tenant_id: string;
  brand_id: string;
  platform: Platform;
  account_kind: AccountKind;
  proposed_handle?: string | null;
  handle?: string | null;
  profile_url?: string | null;
  owner_label?: string | null;
  profile_checklist: ProfileChecklist;
  profile_public: boolean;
  status: LifecycleStatus;
  version: number;
}
export type CapabilityStatus =
  | "CONFIRMED_LIVE" | "SANDBOX" | "STUB" | "NOT_SUPPORTED" | "REQUIRES_HUMAN" | "NO_MEDIDO";
export interface CapabilityCell {
  platform: Platform;
  capability: string;
  nadakki_status: CapabilityStatus;
  platform_doc_status: "MEDIDO" | "NO_MEDIDO";
  note?: string;
}
export interface ConnectionStart {
  authorization_url: string;
  expires_at: string;
  requested_scopes: string[];
}
export type Result<T> = { ok: true; data: T } | { ok: false; status: number; code?: string };

export interface TransitionBody {
  to_status: LifecycleStatus;
  reason?: string;
  evidence_ref?: string;
}

export interface SocialClient {
  listBrands(): Promise<Result<Brand[]>>;
  listAccounts(brandId: string): Promise<Result<SocialAccount[]>>;
  getCapabilities(): Promise<Result<CapabilityCell[]>>;
  createAccount(body: { brand_id: string; account_kind: AccountKind; proposed_handle?: string }): Promise<Result<SocialAccount>>;
  updateAccount(id: string, version: number, patch: Partial<Pick<SocialAccount, "handle" | "profile_url" | "owner_label" | "profile_checklist" | "proposed_handle">>): Promise<Result<SocialAccount>>;
  transition(id: string, version: number, body: TransitionBody): Promise<Result<SocialAccount>>;
  startConnection(id: string, purpose?: "identity" | "publish" | "analytics"): Promise<Result<ConnectionStart>>;
}
