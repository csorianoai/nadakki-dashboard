/** Tipos escritos a mano de C-SITES-LEADS 1.1.0 (copia en lib/sites/contract/leads-schema.json). */
export type ConsentChannel = "email" | "phone_sms" | "whatsapp";
export const CHANNELS: readonly ConsentChannel[] = ["email", "phone_sms", "whatsapp"];
export type LeadStatus = "received" | "projected" | "projection_failed";
export const LEAD_STATUSES: readonly LeadStatus[] = ["received", "projected", "projection_failed"];
export type ClickConsent = "granted" | "denied" | "unknown" | "not_required";

export interface ConsentRecord {
  consent_id: string; channel: ConsentChannel; status: "granted" | "denied" | "revoked";
  text_version: string; text_locale: "es" | "en"; text_sha256?: string; recorded_at: string; supersedes_id?: string | null;
}
export interface AdClick {
  click_consent: ClickConsent; gclid?: string; gbraid?: string; wbraid?: string; fbclid?: string;
  landing_path?: string; clicked_at?: string; consent_region?: string;
}
export interface Lead {
  id: string; tenant_id: string; vertical: string; site_id: string; idempotency_key: string; name: string;
  email?: string; phone?: string; message: string; locale: "es" | "en"; source_page: string;
  consents: ConsentRecord[]; contactable_channels: ConsentChannel[]; status: LeadStatus;
  ad_click?: AdClick | null; ga_client_id?: string | null; source?: "web_form" | "email_import"; created_at: string;
}
/** `required` de cada tipo, espejo del contrato; tests/sites/contactos.test.tsx lo compara con leads-schema.json. */
export const LEAD_REQUIRED: Record<string, readonly string[]> = {
  Lead: ["id", "tenant_id", "vertical", "site_id", "idempotency_key", "name", "message", "locale", "source_page", "consents", "contactable_channels", "status", "created_at"],
  ConsentRecord: ["consent_id", "channel", "status", "text_version", "text_locale", "recorded_at"],
  AdClick: ["click_consent"],
};
