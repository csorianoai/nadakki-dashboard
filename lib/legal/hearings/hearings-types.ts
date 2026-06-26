/**
 * Hearings (audiencias) types — derived 1:1 from the live backend OpenAPI
 * (https://nadakki-ai-suite.onrender.com/openapi.json) schemas:
 *   HearingOut · HearingCreate · HearingStatusPatch · HearingListResponse ·
 *   HearingKPIs · HearingConfigResponse.
 *
 * Owner: frontend / legal. Task: SUPERLOOP MAESTRO v2 — hearings calendar UI.
 *
 * Contract notes (see docs/hearings/HEARINGS_UI_PLAN.md):
 *  - hearing_date (ISO TIMESTAMPTZ), courtroom (NOT court_name), duration_minutes.
 *  - status / hearing_type are open strings; the allowed subset is read from /config
 *    at runtime (statuses[] / hearing_types[]). Do NOT hardcode the enum values.
 */

/** Open string; allowed subset comes from /config (config.statuses). */
export type HearingStatus = string;

/** Open string; allowed subset comes from /config (config.hearing_types). */
export type HearingType = string;

/** Response of GET/POST/PATCH single hearing — schema `HearingOut`. */
export interface HearingOut {
  id: string;
  tenant_id: string;
  case_id: string | null;
  external_ref: string | null;
  title: string;
  description: string | null;
  hearing_type: HearingType;
  status: HearingStatus;
  /** ISO 8601 TIMESTAMPTZ. */
  hearing_date: string;
  duration_minutes: number;
  location: string | null;
  courtroom: string | null;
  judge_name: string | null;
  jurisdiction: string;
  timezone: string;
  assigned_to_user_id: string | null;
  notes: string | null;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Body for POST /api/v1/legal/hearings — schema `HearingCreate`.
 * Only `title` and `hearing_date` are required; the rest are server-defaulted.
 * NOTE: tenant_id is NEVER part of the payload (tenant travels in X-Tenant-ID).
 */
export interface HearingCreatePayload {
  title: string;
  /** ISO 8601 TIMESTAMPTZ. */
  hearing_date: string;
  hearing_type?: HearingType;
  case_id?: string | null;
  external_ref?: string | null;
  description?: string | null;
  duration_minutes?: number;
  location?: string | null;
  courtroom?: string | null;
  judge_name?: string | null;
  jurisdiction?: string;
  timezone?: string;
  assigned_to_user_id?: string | null;
  notes?: string | null;
}

/** Body for PATCH /api/v1/legal/hearings/{hearing_id}/status — schema `HearingStatusPatch`. */
export interface HearingStatusPatchBody {
  status: HearingStatus;
  reason?: string | null;
}

/** Response of GET /api/v1/legal/hearings — schema `HearingListResponse`. */
export interface HearingListResponse {
  hearings: HearingOut[];
  total: number;
}

/** Response of GET /api/v1/legal/hearings/kpis — schema `HearingKPIs`. */
export interface HearingKPIs {
  upcoming_7d: number;
  overdue: number;
  completed_30d: number;
  cancelled_30d: number;
  by_status: Record<string, number>;
  by_type: Record<string, number>;
  next_hearing: HearingOut | null;
  /** Honest flag: backend returned placeholder/demo data, not real tenant data. */
  demo_data: boolean;
}

/** Response of GET /api/v1/legal/hearings/config — schema `HearingConfigResponse`. */
export interface HearingConfigResponse {
  statuses: HearingStatus[];
  hearing_types: HearingType[];
  default_timezone: string;
  /** status -> allowed next statuses (backend remains the validating authority). */
  transitions: Record<string, string[]>;
}

/** Query params for GET /api/v1/legal/hearings (exact names from OpenAPI). */
export interface HearingListFilters {
  /** ISO date/datetime lower bound. */
  from?: string;
  /** ISO date/datetime upper bound. */
  to?: string;
  case_id?: string;
  status?: HearingStatus;
  hearing_type?: HearingType;
  limit?: number;
  offset?: number;
}
