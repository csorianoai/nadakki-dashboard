export class LegalApiHttpError extends Error {
  readonly status: number;
  readonly body: string;
  readonly detail: string;

  constructor(context: string, status: number, body: string) {
    const detail = extractLegalApiDetail(body);
    super(`${context} (${status}): ${detail}`);
    this.name = "LegalApiHttpError";
    this.status = status;
    this.body = body;
    this.detail = detail;
  }
}

export function extractLegalApiDetail(raw: string): string {
  if (!raw.trim()) return "Sin cuerpo de respuesta";
  try {
    const j = JSON.parse(raw) as Record<string, unknown>;
    if (typeof j.detail === "string") return j.detail;
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
