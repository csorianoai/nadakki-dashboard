/** Subconjunto de C-PI 1.0.0 (congelado) que usa la pantalla. Nada de tenant: sale del token en el BFF. */
export type LinkStatus = "proposed" | "confirmed" | "rejected";
export type DocStatus = "pending" | "stored" | "failed";
export type Target = { kind: "property_id" | "property_unit_id"; id: string };

export type Evidence = { kind: string; observed_at: string };
export type AdvertiserLink = {
  id: string; advertiser_ref: string; status: LinkStatus; confidence: number; evidence: Evidence[];
  status_reason: string | null; confirmed_at: string | null;
};
export type SignalRef = { id: string; signal_id: string; signal_type: string; observed_at: string };
export type PiDocument = { id: string; status: DocStatus; mime_type: string; size_bytes: number; retention_until: string | null };
export type BrokerPolicy = {
  registration_required: boolean; registration_status: "not_confirmed" | "confirmed";
  prospect_submission_allowed: boolean; developer_links_allowed: boolean; is_default: boolean;
};

/** Estado de una sección (x-bff.status_to_card_state): 200 → ok, 401 → session_expired, 404 → hidden, 503 → service_unavailable, resto → error. */
export type Section<T> =
  | { state: "loading" }
  | { state: "ok"; data: T }
  | { state: "session_expired" | "hidden" | "service_unavailable" | "error" };

export type PiData = {
  signals: Section<SignalRef[]>; links: Section<AdvertiserLink[]>; documents: Section<PiDocument[]>; policy: Section<BrokerPolicy>;
};
