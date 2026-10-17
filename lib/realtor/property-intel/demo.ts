import type { PiData } from "./types";

/** HQ sintético (tenant QA 9a9a0001-0000-4000-8000-000000000001). Solo se alcanza con DEMO encendido y sin llamada al backend. */
export const HQ_QA_TENANT = "9a9a0001-0000-4000-8000-000000000001";
export const HQ_PROPERTY_ID = "9a9a0001-0000-4000-8000-0000000000a1";

const T = "2026-10-01T12:00:00Z";
export const HQ_DEMO: PiData = {
  signals: { state: "ok", data: [
    { id: "s1", signal_id: "sg1", signal_type: "keyword_stats", observed_at: T },
    { id: "s2", signal_id: "sg2", signal_type: "interest_series", observed_at: T },
  ] },
  links: { state: "ok", data: [
    { id: "l1", advertiser_ref: "anunciante-sintetico-1", status: "proposed", confidence: 0.9, evidence: [{ kind: "landing_domain_match", observed_at: T }, { kind: "project_name_in_copy", observed_at: T }], status_reason: null, confirmed_at: null },
    { id: "l2", advertiser_ref: "anunciante-sintetico-2", status: "confirmed", confidence: 1, evidence: [{ kind: "manual", observed_at: T }], status_reason: "Revisado", confirmed_at: T },
  ] },
  documents: { state: "ok", data: [
    { id: "d1", status: "stored", mime_type: "application/pdf", size_bytes: 20480, retention_until: null },
    { id: "d2", status: "pending", mime_type: "application/pdf", size_bytes: 10240, retention_until: null },
  ] },
  policy: { state: "ok", data: { registration_required: true, registration_status: "not_confirmed", prospect_submission_allowed: false, developer_links_allowed: false, is_default: true } },
};
