// CALIBRADO contra backend real el 2026-04-25.
// NO modificar nombres de campos sin verificar contra backend nuevamente.

/**
 * Shape canonico del response de GET /api/v1/sic/routeone/health
 */
export interface CHHealthResponse {
  status: "ok" | "degraded" | "down";
  routeone_parity_enabled: boolean;
  storage_mode: "memory" | "pg";
  storage_status: "ok" | "degraded" | "down";
  webhook_status: "ok" | "degraded" | "unknown";
  tenant_probe: string;
  timestamp: string;
}

/**
 * Status del lifecycle de una aplicacion.
 * NOTA: lista a confirmar exhaustivamente en Fase 2.
 */
export type CHApplicationStatus =
  | "draft"
  | "submitted"
  | "routed"
  | "offered"
  | "accepted"
  | "rejected"
  | "funded"
  | "cancelled";

/**
 * Shape del response de:
 * - POST /api/v1/sic/credit-applications
 * - GET /api/v1/sic/credit-applications/{id}
 * - GET /api/v1/sic/credit-applications
 *
 * IMPORTANTE: requested_amount y down_payment son strings (Pydantic Decimal).
 */
export interface CHApplication {
  application_id: string;
  tenant_id: string;
  applicant_name: string;
  applicant_email: string | null;
  applicant_phone: string | null;
  dealer_id: string | null;
  vehicle_vin: string | null;
  vehicle_year: number | null;
  vehicle_make: string | null;
  vehicle_model: string | null;
  requested_amount: string;
  down_payment: string | null;
  status: CHApplicationStatus;
  created_at: string;
  updated_at: string;
}

/**
 * Body para POST /api/v1/sic/credit-applications.
 */
export interface CHCreateApplicationRequest {
  applicant_name: string;
  applicant_email?: string;
  applicant_phone?: string;
  dealer_id?: string;
  vehicle_vin?: string;
  vehicle_year?: number;
  vehicle_make?: string;
  vehicle_model?: string;
  requested_amount?: string | number;
  down_payment?: string | number;
}

/**
 * Envelope FastAPI estandar.
 */
export interface CHFastApiErrorEnvelope {
  detail:
    | string
    | {
        error?: string;
        message?: string;
        feature_enabled?: boolean;
        [k: string]: unknown;
      };
}
