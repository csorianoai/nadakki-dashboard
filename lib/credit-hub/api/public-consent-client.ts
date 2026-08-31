const PUBLIC_CONSENT_BASE = "/api/v2/credit/consent";
const REQUEST_TIMEOUT_MS = 30_000;

export interface PublicConsentView {
  application_id: string;
  method: "PRESENT" | "WHATSAPP" | "EMAIL" | "SMS_OTP" | "SELFIE" | (string & {});
  institution_name: string;
  branding: {
    logo_url?: string | null;
    primary_color?: string | null;
    secondary_color?: string | null;
  };
  regulatory_texts: Record<string, string>;
  consents_required: string[];
  expires_at: string;
  /** Si el backend indica que ya no aplica firma (opcional). */
  already_accepted?: boolean;
  accepted_at?: string | null;
}

export interface PublicAcceptResponse {
  accepted_at: string;
  audit_hash: string;
}

export interface PublicAcceptPayload {
  consents_accepted: string[];
  full_name: string;
  otp_code?: string;
  selfie_data_url?: string;
}

export class ConsentTokenInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConsentTokenInvalidError";
  }
}

export class ConsentOtpInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConsentOtpInvalidError";
  }
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

export class PublicConsentClient {
  /**
   * La ruta publica SIEMPRE va same-origin, por el rewrite
   * `/api/v2/credit/:path*` de next.config.js.
   *
   * Antes el default salia de `process.env.NEXT_PUBLIC_API_URL`, que Next hornea
   * en el bundle. En staging quedo horneada como "https://api.nadakki.com": el
   * cliente construia una URL absoluta a un host ausente del `connect-src` del
   * CSP, el navegador cortaba el fetch antes de emitirlo y el `.catch` de la
   * pagina lo pintaba como enlace invalido. Medido: 39 requests, cero a /api/.
   *
   * Same-origin no depende de ninguna variable de build y 'self' siempre esta
   * en el CSP. El cliente del dealer -consent-client.ts- ya lo hacia asi, y por
   * eso el consentimiento presencial nunca se rompio.
   */
  constructor(private readonly baseUrl: string = "") {}

  private url(path: string): string {
    const p = `${this.baseUrl}${PUBLIC_CONSENT_BASE}${path}`;
    return this.baseUrl ? p : `${PUBLIC_CONSENT_BASE}${path}`;
  }

  async getView(token: string): Promise<PublicConsentView> {
    // Validate the token with the server before loading the public view. The
    // expiry timestamp is informational; it must not be trusted by the client.
    const status = await this.getStatus(token);
    if (!isUsableStatus(status.status)) {
      throw new ConsentTokenInvalidError("Token inválido o expirado");
    }
    return this.getPublicView(token);
  }

  /** Fetches the public form after the caller has already checked /status. */
  async getPublicView(token: string): Promise<PublicConsentView> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(this.url(`/${encodeURIComponent(token)}/public`), {
        method: "GET",
        credentials: "omit",
        signal: controller.signal,
      });

      const body = await parseBody(res);

      if (res.status === 404) {
        throw new ConsentTokenInvalidError("Token inválido o expirado");
      }
      if (res.status === 410) {
        throw new ConsentTokenInvalidError("Enlace expirado");
      }
      if (!res.ok) {
        throw new Error(messageFromBody(body, res.statusText));
      }
      return body as PublicConsentView;
    } catch (e) {
      if (e instanceof ConsentTokenInvalidError) throw e;
      if (e instanceof DOMException && e.name === "AbortError") {
        throw new Error("Tiempo de espera agotado");
      }
      throw e instanceof Error ? e : new Error("Error al cargar");
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async getStatus(token: string): Promise<{ status: string; accepted_at?: string | null }> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(this.url(`/${encodeURIComponent(token)}/status`), {
        method: "GET",
        credentials: "omit",
        signal: controller.signal,
      });
      const body = await parseBody(res);
      if (!res.ok) {
        if (res.status === 404 || res.status === 410) throw new ConsentTokenInvalidError("Token inválido o expirado");
        throw new Error(messageFromBody(body, res.statusText));
      }
      return body as { status: string; accepted_at?: string | null };
    } catch (e) {
      if (e instanceof ConsentTokenInvalidError) throw e;
      if (e instanceof DOMException && e.name === "AbortError") throw new Error("Tiempo de espera agotado");
      throw e instanceof Error ? e : new Error("Error al consultar estado");
    } finally {
      window.clearTimeout(timeoutId);
    }
  }

  async accept(token: string, payload: PublicAcceptPayload): Promise<PublicAcceptResponse> {
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const res = await fetch(this.url(`/${encodeURIComponent(token)}/accept`), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "omit",
        signal: controller.signal,
        body: JSON.stringify(payload),
      });

      const body = await parseBody(res);
      const detail = messageFromBody(body, res.statusText);

      if (!res.ok) {
        if (res.status === 400 && /OTP|otp|código|codigo/i.test(detail)) {
          throw new ConsentOtpInvalidError(detail);
        }
        if (res.status === 404 || res.status === 410) {
          throw new ConsentTokenInvalidError(detail);
        }
        throw new Error(detail);
      }

      return body as PublicAcceptResponse;
    } catch (e) {
      if (e instanceof ConsentOtpInvalidError || e instanceof ConsentTokenInvalidError) throw e;
      if (e instanceof DOMException && e.name === "AbortError") {
        throw new Error("Tiempo de espera agotado");
      }
      throw e instanceof Error ? e : new Error("Error al procesar autorización");
    } finally {
      window.clearTimeout(timeoutId);
    }
  }
}

const USABLE_STATUSES = new Set(["INITIATED", "SENT", "VIEWED", "ACCEPTED"]);

export function isUsableStatus(status: string): boolean {
  return USABLE_STATUSES.has(String(status).toUpperCase());
}
