/** Real-time / WebSocket domain (Phase B — Agent-4). */

export type RealtimeConnectionState = "idle" | "connecting" | "connected" | "reconnecting" | "error" | "disabled";

/** Browser WebSockets cannot set HTTP headers; JWT is passed via query string or post-handshake auth message. */
export type RealtimeAuthMode = "query" | "message";

export interface RealtimeClientConfig {
  /** Full ws/wss URL without query (token appended by client). */
  baseUrl: string;
  authMode?: RealtimeAuthMode;
  heartbeatIntervalMs?: number;
  maxReconnectDelayMs?: number;
  minReconnectDelayMs?: number;
  /** Called for connect / disconnect / reconnect / errors (audit trail). */
  onAudit?: (event: string, detail: Record<string, unknown>) => void;
}

export interface RealtimeEnvelope<T = unknown> {
  type: string;
  channel?: string;
  tenant_id?: string;
  payload?: T;
  ts?: string;
}

export interface ApplicationRealtimePayload {
  application_id?: string;
  tenant_id?: string;
  state?: string;
  applicant_name?: string;
  vehicle_label?: string;
  score?: number;
  approval_band?: string;
  bank_decision?: unknown;
  priority?: string;
  updated_at?: string;
}

export type RealtimeApplicationEvent =
  | { kind: "application.created"; application: ApplicationRealtimePayload }
  | { kind: "application.updated"; application: ApplicationRealtimePayload }
  | { kind: "offer.received"; application_id: string; offer: Record<string, unknown> }
  | { kind: "decision.made"; application_id: string; decision: Record<string, unknown> }
  | { kind: "stipulations.updated"; application_id: string; message?: string }
  | { kind: "aggregation.updated"; application_id: string; summary?: Record<string, unknown> }
  | { kind: "ping" }
  | { kind: "pong" }
  | { kind: "unknown"; raw: unknown };
