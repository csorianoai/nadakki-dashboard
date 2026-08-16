/** Read model from GET /api/v2/credit/applications/{id}/expediente/full */

export interface ExpedienteFullResponse {
  application_id: string;
  tenant_id: string;
  user_role?: string;
  state?: string;
  applicant?: Record<string, unknown>;
  vehicle?: Record<string, unknown>;
  financial?: Record<string, unknown>;
  documents?: unknown[];
  credit_history?: {
    score?: number;
    summary?: Record<string, unknown>;
    source?: string;
  };
  decisions?: Array<{ kind?: string; payload?: Record<string, unknown> }>;
  stipulations?: unknown[];
  offers?: unknown[];
  audit_trail?: unknown;
  completeness?: Record<string, unknown>;
  generated_at?: string;
  /** Pilot readiness labels (backend expediente/full; additive). */
  data_source_label?: string | null;
  kyc_mode?: string | null;
  ocr_mode?: string | null;
  pilot_labels?: {
    data_source_label?: string | null;
    kyc_mode?: string | null;
    ocr_mode?: string | null;
  };
  /** Analysis data with ratios (backend v2 structure) */
  analysis?: {
    pti?: number;
    dti?: number;
    ltv?: number;
    [key: string]: unknown;
  };
  /** Co-firmante data */
  co_firmante?: Record<string, unknown>;
  /** Referencias personales */
  referencias_personales?: unknown[];
}
