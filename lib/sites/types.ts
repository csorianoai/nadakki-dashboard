/**
 * Tipos de "Mi web" escritos a mano contra C-SITES-ADMIN-API 1.0.0 (copia en ./contract/schema.json).
 * Solo lo que usan las pantallas. El tenant NUNCA se envia: los tipos de entrada no tienen tenant_id.
 */
export type Uuid = string;
export type Timestamp = string;
export type DateStr = string;

export const SEVERITIES = ["block", "warn", "info"] as const;
export type Severity = (typeof SEVERITIES)[number];
export const SITE_STATUSES = ["draft", "in_review", "published", "suspended"] as const;
export type SiteStatus = (typeof SITE_STATUSES)[number];
export type PublishState = "draft" | "published" | "withdrawn";

export interface I18nText { es: string; en?: string }
export interface I18nTextStrict { es: string; en: string }

export interface Site {
  id: Uuid; tenant_id: Uuid; vertical: string; name: I18nText; status: SiteStatus; content_version: number;
  [extra: string]: unknown;
}
export interface Block { block_id: string; type: string; data?: Record<string, unknown>; i18n?: Record<string, unknown> }
export interface PageFields {
  page_key: string; slug: Record<string, string>; title: I18nText; meta_description: I18nText; body: Block[]; sort_order: number;
}
export interface Page extends Partial<PageFields> {
  id: Uuid; tenant_id: Uuid; vertical: string; site_id: Uuid; page_key: string; status: "draft" | "published";
}
export interface GeoPoint { lat: number; lng: number }
export interface ListingFields {
  item_kind: "property" | "generic"; vertical_attrs: Record<string, unknown>; slug: string; title: I18nText;
  description: I18nText; features: I18nText[]; zone_id: Uuid | null; building_id: Uuid | null;
  development_id: Uuid | null; geo: GeoPoint | null; featured: boolean; media: Uuid[];
}
export interface Listing extends Partial<ListingFields> {
  id: Uuid; tenant_id: Uuid; vertical: string; site_id: Uuid; slug: string; publish_state: PublishState;
}
export interface DevelopmentFields {
  slug: string; name: string; description: I18nText; area: string; zone_id: Uuid | null; address: Record<string, unknown>;
  dev_type: string; status: string; delivery_year: number; price_from: string; currency: string; developer: string;
  units: Record<string, unknown>[]; amenities: I18nText[]; media: Uuid[]; geo: GeoPoint | null;
}
export interface Development extends Partial<DevelopmentFields> {
  id: Uuid; tenant_id: Uuid; vertical: string; site_id: Uuid; slug: string; authorized: boolean; publish_state: PublishState;
}
export interface ZoneFields {
  slug: string; name: I18nText; lead: I18nText; body: I18nText; price_range: Record<string, unknown>;
  schools: Record<string, unknown>[]; distances: Record<string, unknown>[]; photo_asset_id: Uuid | null; source: string; source_date: DateStr;
}
export interface Zone extends Partial<ZoneFields> {
  id: Uuid; tenant_id: Uuid; vertical: string; site_id: Uuid; slug: string; publish_state: PublishState;
}
export interface BuildingFields {
  slug: string; name: string; zone_id: Uuid | null; summary: I18nText; hoa: Record<string, unknown>;
  rules: Record<string, unknown>; structural: Record<string, unknown>; data_source: string; data_date: DateStr;
}
export interface Building extends Partial<BuildingFields> {
  id: Uuid; tenant_id: Uuid; vertical: string; site_id: Uuid; slug: string; publish_state: PublishState;
}

export type PermissionType = "own" | "developer" | "owner" | "stock";
export type MediaStatus = "pending" | "approved" | "rejected" | "revoked";
export interface MediaAsset {
  id: Uuid; tenant_id: Uuid; vertical: string; alt: I18nTextStrict; permission_type: PermissionType;
  permission_date: DateStr; acquired_on: DateStr; status: MediaStatus; [extra: string]: unknown;
}
export interface MediaCreate {
  upload_id: Uuid; alt: I18nTextStrict; source: string; license: string; permission_type: PermissionType;
  permission_granted_by: string; permission_scope: string; permission_date: DateStr; acquired_on: DateStr;
  permission_evidence?: string; source_url?: string | null; author?: string | null;
}
export type MediaUpdate = Partial<Omit<MediaCreate, "upload_id">>;
export interface MediaPresignRequest { mime_type: string; size_bytes: number; sha256: string }
export interface MediaPresign { upload_id: Uuid; upload_url: string; method: "PUT"; headers?: Record<string, string>; expires_at: Timestamp }
export interface MediaRevoke { reason: "permission_withdrawn" | "dmca" | "staff_review" | "owner_request" }

export interface Violation { rule_id: string; severity: Severity; message: string; field: string }
export interface PublishRequest { targets?: Record<string, unknown>[]; note?: string }
export interface PublishResult {
  site_id: Uuid; status: SiteStatus; content_version: number; evaluation_id: Uuid; published_at?: Timestamp | null;
  warnings: Violation[]; pending_manual_rules?: string[];
}
export interface ReadinessReport {
  site_id: Uuid; ready: boolean; blocking: Violation[]; warnings: Violation[]; info: Violation[]; evaluated_at: Timestamp;
}
export interface OverrideCreate { rule_id: string; target?: unknown; justification: string; expires_at: Timestamp }
export interface ComplianceOverride { id: Uuid; rule_id: string; expires_at: Timestamp; [extra: string]: unknown }
export interface ComplianceEvaluation {
  id: Uuid; site_id: Uuid; trigger: string; result: "pass" | "warn" | "block"; findings: Violation[]; created_at: Timestamp;
}

export const PROBLEM_CODES = [
  "UNAUTHENTICATED", "FORBIDDEN", "TENANT_MISMATCH", "TENANT_FIELD_FORBIDDEN", "NOT_FOUND", "VALIDATION_ERROR", "CONFLICT",
  "IDEMPOTENCY_KEY_REUSED", "RATE_LIMITED", "PUBLISH_BLOCKED", "OVERRIDE_NOT_ALLOWED", "LEGAL_FIELD_STAFF_ONLY",
  "RESERVED_BLOCK_TYPE", "IMAGE_PERMISSION_REQUIRED",
] as const;
export type ProblemCode = (typeof PROBLEM_CODES)[number];
/** RFC 9457 + `code` estable. */
export interface Problem {
  type: string; title: string; status: number; code: ProblemCode; detail?: string; instance?: string;
  errors?: Record<string, unknown>[]; violations?: Violation[];
}

export interface Paginated<T> { items: T[]; next_cursor: string | null }
export type SiteUpdate = Partial<{
  template_id: string; name: I18nText; languages: Array<"es" | "en">; default_language: "es" | "en";
  theme: Record<string, unknown>; contact: { phone?: string; whatsapp?: string; email?: string; address?: string };
}>;
export type PageUpdate = Partial<PageFields>;
export type ListingCreate = Partial<ListingFields> & Pick<ListingFields, "slug" | "title">;
export type ListingUpdate = Partial<ListingFields>;
export type DevelopmentCreate = Partial<DevelopmentFields> & Pick<DevelopmentFields, "slug" | "name">;
export type DevelopmentUpdate = Partial<DevelopmentFields>;
export type ZoneCreate = Partial<ZoneFields> & Pick<ZoneFields, "slug" | "name">;
export type ZoneUpdate = Partial<ZoneFields>;
export type BuildingCreate = Partial<BuildingFields> & Pick<BuildingFields, "slug" | "name">;
export type BuildingUpdate = Partial<BuildingFields>;

/** Propiedades requeridas por tipo, espejo de `required` del contrato; tests/sites/contract.test.ts lo compara con schema.json. */
export const TYPE_REQUIRED: Record<string, readonly string[]> = {
  I18nText: ["es"],
  Site: ["id", "tenant_id", "vertical", "name", "status", "content_version"],
  Page: ["id", "tenant_id", "vertical", "site_id", "page_key", "status"],
  Listing: ["id", "tenant_id", "vertical", "site_id", "slug", "publish_state"],
  Development: ["id", "tenant_id", "vertical", "site_id", "slug", "authorized", "publish_state"],
  Zone: ["id", "tenant_id", "vertical", "site_id", "slug", "publish_state"],
  Building: ["id", "tenant_id", "vertical", "site_id", "slug", "publish_state"],
  Block: ["block_id", "type"],
  MediaAsset: ["id", "tenant_id", "vertical", "alt", "permission_type", "permission_date", "acquired_on", "status"],
  MediaCreate: ["upload_id", "alt", "source", "license", "permission_type", "permission_granted_by", "permission_scope", "permission_date", "acquired_on"],
  Violation: ["rule_id", "severity", "message", "field"],
  Problem: ["type", "title", "status", "code"],
  PublishResult: ["site_id", "status", "content_version", "evaluation_id", "warnings"],
  ReadinessReport: ["site_id", "ready", "blocking", "warnings", "info", "evaluated_at"],
  OverrideCreate: ["rule_id", "justification", "expires_at"],
  ComplianceOverride: ["id", "rule_id", "expires_at"],
};
