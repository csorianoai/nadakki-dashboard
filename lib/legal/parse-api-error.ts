export class LegalApiHttpError extends Error {
  readonly status: number;
  readonly body: string;
  readonly detail: string;
  readonly requestId?: string;

  constructor(context: string, status: number, body: string) {
    const detail = extractLegalApiDetail(body);
    super(`${context} (${status}): ${detail}`);
    this.name = "LegalApiHttpError";
    this.status = status;
    this.body = body;
    this.detail = detail;
    this.requestId = extractLegalApiRequestId(body);
  }
}

export function extractLegalApiRequestId(raw: string): string | undefined {
  try {
    const value = JSON.parse(raw) as Record<string, unknown>;
    if (typeof value.request_id === "string" && value.request_id.trim()) return value.request_id;
    const detail = value.detail;
    if (detail && typeof detail === "object" && !Array.isArray(detail)) {
      const requestId = (detail as Record<string, unknown>).request_id;
      if (typeof requestId === "string" && requestId.trim()) return requestId;
    }
  } catch {
    /* A plain-text backend error has no request id to expose. */
  }
  return undefined;
}

export function extractLegalApiDetail(raw: string): string {
  if (!raw.trim()) return "Sin cuerpo de respuesta";
  try {
    const j = JSON.parse(raw) as Record<string, unknown>;
    if (typeof j.detail === "string") return j.detail;
    // {detail: {codigo, mensaje}}: errores 422 del Core Legal (plazos, partes, archivo).
    if (j.detail && typeof j.detail === "object" && !Array.isArray(j.detail)) {
      const m = (j.detail as Record<string, unknown>).mensaje;
      if (typeof m === "string" && m.trim()) return m;
    }
    if (Array.isArray(j.detail)) {
      return j.detail
        .map((d) =>
          typeof d === "object" && d && "msg" in d
            ? String((d as { msg: unknown }).msg)
            : JSON.stringify(d),
        )
        .join("; ");
    }
    const err = j.error as Record<string, unknown> | undefined;
    if (err && typeof err.message === "string") return err.message;
    if (typeof j.message === "string") return j.message;
    // Cuerpos del Core Legal (p. ej. EstrategiasNoDisponibles): {code, error: "<CODIGO>", motivo} o {mensaje}.
    if (typeof j.motivo === "string" && j.motivo.trim()) return j.motivo;
    if (typeof j.mensaje === "string" && j.mensaje.trim()) return j.mensaje;
  } catch {
    /* plain text */
  }
  return raw.length > 400 ? `${raw.slice(0, 400)}…` : raw;
}

export async function throwIfLegalApiError(res: Response, context: string): Promise<void> {
  if (res.ok) return;
  const body = await res.text();
  throw new LegalApiHttpError(context, res.status, body);
}

export async function readLegalJson<T>(res: Response, context: string): Promise<T> {
  const text = await res.text();
  if (!res.ok) throw new LegalApiHttpError(context, res.status, text);
  if (!text) return {} as T;
  return JSON.parse(text) as T;
}
