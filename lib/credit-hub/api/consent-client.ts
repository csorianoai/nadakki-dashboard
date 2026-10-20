import { tokenStorage } from "@/lib/auth/token-storage";

const CREDIT_CONSENT_BASE = "/api/v2/credit/consent";
const REQUEST_TIMEOUT_MS = 30_000;
const LEGACY_ACCESS_TOKEN_STORAGE_KEY = "nadakki_sic_token";

export interface ConsentInitiateResponse {
  token?: string;
  event_id?: string;
  expires_at?: string;
  status: string;
}

export interface ConsentStatusResponse {
  status: "INITIATED" | "SENT" | "VIEWED" | "ACCEPTED" | "REJECTED" | "EXPIRED" | "FAILED" | "NOT_FOUND" | (string & {});
  method: string | null;
  accepted_at: string | null;
}

export interface PresentConsentTextResponse {
  consent_text: string | null;
  consent_text_version: string | null;
  /** true cuando el backend no entrega el texto legal (no se puede firmar). */
  unavailable?: boolean;
}

/** Llaves del texto RD v1.0 que rellena quien firma (las de servidor las pone el backend). */
export const PRESENT_TEXT_CLIENT_FIELDS = [
  "NOMBRE_TITULAR",
  "CEDULA",
  "NOMBRE_CONCESIONARIO",
  "VEHICULO",
  "LISTA_ENTIDADES",
  "CONTACTO_DERECHOS",
  "LUGAR",
  "FECHA",
] as const;

export type PresentTextField = (typeof PRESENT_TEXT_CLIENT_FIELDS)[number];
export type PresentTextFields = Record<PresentTextField, string>;

export interface ConsentAcceptPayload {
  otp_code?: string;
  consents_accepted: string[];
  full_name: string;
  /** Mismos datos con los que se pidió el texto presencial: el backend rellena y firma ese texto. */
  texto_campos?: PresentTextFields;
}

export interface ConsentAcceptResponse {
  accepted_at: string;
  audit_hash: string;
}

export interface PresentConsentAcceptResponse {
  consent_id?: string;
  status: "ACCEPTED" | (string & {});
  accepted_at?: string;
  audit_hash: string;
  consent_text_version?: string;
}

export interface ConsentHistoryEvent {
  id: string;
  method: string;
  status: string;
  sent_at: string | null;
  viewed_at: string | null;
  accepted_at: string | null;
  phone_masked: string | null;
  email_masked: string | null;
  consent_text_version: string;
  audit_hash: string;
  created_at: string;
}

/** El backend respondió 409 consent_channel_unavailable: el canal no entrega el enlace de verdad. */
export class ConsentChannelUnavailableError extends Error {
  constructor(
    public readonly channel: string,
    public readonly reason: string,
    message: string
  ) {
    super(message);
    this.name = "ConsentChannelUnavailableError";
  }
}

/** Error HTTP del backend de consentimiento; conserva el código de `detail.code` cuando lo hay. */
export class ConsentApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code: string | null,
    public readonly missing: string[]
  ) {
    super(message);
    this.name = "ConsentApiError";
  }
}

function base64UrlJson(value: unknown): string {
  const bytes = new TextEncoder().encode(JSON.stringify(value));
  let bin = "";
  bytes.forEach((b) => {
    bin += String.fromCharCode(b);
  });
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Solo el estado SENT del backend cuenta como «enviado» (mock_sent o desconocido, no). */
export function isConfirmedSent(status: unknown): boolean {
  return status === "SENT";
}

async function parseBody(response: Response): Promise<unknown> {
  try {
    return await response.clone().json();
  } catch {
    try {
      return await response.text();
    } catch {
      return null;
    }
  }
}

function messageFromBody(body: unknown, fallback: string): string {
  if (typeof body === "string" && body.trim()) return body;
  if (body && typeof body === "object") {
    const r = body as Record<string, unknown>;
    if (typeof r.detail === "string") return r.detail;
    if (typeof r.message === "string") return r.message;
    if (typeof r.error === "string") return r.error;
  }
  return fallback;
}

function readBearerAccessToken(): string | null {
  const fromAuthV2 = tokenStorage.getAccessToken();
  if (fromAuthV2) return fromAuthV2;
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(LEGACY_ACCESS_TOKEN_STORAGE_KEY);
}

export class ConsentApiClient {
  constructor(private readonly tenantId: string) {}

  private headers(includeTenant: boolean): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (includeTenant) {
      h["X-Tenant-ID"] = this.tenantId;
      const bearerAccessToken = readBearerAccessToken();
      if (bearerAccessToken) {
        h["Authorization"] = `Bearer ${bearerAccessToken}`;
      }
    }
    return h;
  }

  private async fetchJson<T>(path: string, init: RequestInit & { includeTenant?: boolean }): Promise<T> {
    const { includeTenant = true, headers: extraHeaders, ...rest } = init;
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(`${CREDIT_CONSENT_BASE}${path}`, {
        ...rest,
        headers: { ...this.headers(includeTenant), ...(extraHeaders as Record<string, string> | undefined) },
        credentials: "include",
        signal: controller.signal,
      });
      const body = await parseBody(response);
      if (!response.ok) {
        const detail = body && typeof body === "object" ? (body as Record<string, unknown>).detail : null;
        if (response.status === 409 && detail && typeof detail === "object") {
          const d = detail as Record<string, unknown>;
          if (d.code === "consent_channel_unavailable") {
            throw new ConsentChannelUnavailableError(String(d.channel ?? ""), String(d.reason ?? ""), response.statusText);
          }
        }
        const d = detail && typeof detail === "object" ? (detail as Record<string, unknown>) : null;
        throw new ConsentApiError(
          response.status,
          messageFromBody(body, response.statusText),
          d && typeof d.code === "string" ? d.code : null,
          d && Array.isArray(d.missing) ? d.missing.map(String) : []
        );
      }
      return body as T;
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async initiate(
    applicationId: string,
    method: "PRESENT" | "WHATSAPP" | "EMAIL" | "SMS_OTP" | "SELFIE",
    payload: { phone?: string; email?: string }
  ): Promise<ConsentInitiateResponse> {
    return this.fetchJson<ConsentInitiateResponse>(`/${encodeURIComponent(applicationId)}/initiate`, {
      method: "POST",
      body: JSON.stringify({ method, ...payload }),
      includeTenant: true,
    });
  }

  async accept(token: string, payload: ConsentAcceptPayload): Promise<ConsentAcceptResponse> {
    return this.fetchJson<ConsentAcceptResponse>(`/${encodeURIComponent(token)}/accept`, {
      method: "POST",
      body: JSON.stringify(payload),
      includeTenant: false,
    });
  }

  async acceptPresent(applicationId: string, payload: ConsentAcceptPayload): Promise<PresentConsentAcceptResponse> {
    return this.fetchJson<PresentConsentAcceptResponse>(`/${encodeURIComponent(applicationId)}/present/accept`, {
      method: "POST",
      body: JSON.stringify(payload),
      includeTenant: true,
    });
  }

  /**
   * Sin los datos del documento no hay texto que pedir: falla cerrado sin petición.
   * El texto real lo trae `fetchPresentText` con esos datos.
   */
  async getPresentText(_applicationId: string): Promise<PresentConsentTextResponse> {
    return { consent_text: null, consent_text_version: null, unavailable: true };
  }

  /**
   * Texto RD v1.0 rellenado para el evento PRESENT pendiente. Los datos del titular viajan en la
   * cabecera X-Consent-Fields (JSON base64url), nunca en la URL, como exige el backend.
   */
  async fetchPresentText(applicationId: string, campos: PresentTextFields): Promise<PresentConsentTextResponse> {
    return this.fetchJson<PresentConsentTextResponse>(`/${encodeURIComponent(applicationId)}/present/text`, {
      method: "GET",
      includeTenant: true,
      headers: { "X-Consent-Fields": base64UrlJson(campos) },
    });
  }

  async getStatus(token: string): Promise<ConsentStatusResponse> {
    return this.fetchJson<ConsentStatusResponse>(`/${encodeURIComponent(token)}/status`, {
      method: "GET",
      includeTenant: false,
    });
  }

  async getHistory(applicationId: string): Promise<ConsentHistoryEvent[]> {
    return this.fetchJson<ConsentHistoryEvent[]>(`/application/${encodeURIComponent(applicationId)}/history`, {
      method: "GET",
      includeTenant: true,
    });
  }
}
