const CREDIT_CONSENT_BASE = "/api/v2/credit/consent";
const REQUEST_TIMEOUT_MS = 30_000;

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

export class ConsentApiClient {
  constructor(private readonly tenantId: string) {}

  private headers(includeTenant: boolean): Record<string, string> {
    const h: Record<string, string> = { "Content-Type": "application/json" };
    if (includeTenant) h["X-Tenant-ID"] = this.tenantId;
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
        throw new Error(messageFromBody(body, response.statusText));
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
