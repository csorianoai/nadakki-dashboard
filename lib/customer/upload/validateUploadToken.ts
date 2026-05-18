export type UploadValidateOk = {
  stipulation_id: string;
  max_size_mb: number;
  allowed_types: string[];
};

export type ValidateResult =
  | { ok: true; data: UploadValidateOk }
  | { ok: false; status: number; detail: unknown };

export function validateEndpointUrl(
  applicationId: string,
  stipulationId: string,
  token: string,
): string {
  const base = `/api/v2/credit/applications/${encodeURIComponent(applicationId)}/stipulations/${encodeURIComponent(stipulationId)}/upload-link/validate`;
  return `${base}?token=${encodeURIComponent(token)}`;
}

export async function fetchUploadLinkValidate(
  applicationId: string,
  stipulationId: string,
  token: string,
): Promise<ValidateResult> {
  const url = validateEndpointUrl(applicationId, stipulationId, token);
  const res = await fetch(url, {
    method: "GET",
    credentials: "omit",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    let detail: unknown = res.statusText;
    try {
      detail = await res.json();
    } catch {
      /* ignore */
    }
    return { ok: false, status: res.status, detail };
  }
  const data = (await res.json()) as UploadValidateOk;
  if (!data || typeof data.stipulation_id !== "string" || !Array.isArray(data.allowed_types)) {
    return { ok: false, status: 502, detail: "invalid_validate_payload" };
  }
  return { ok: true, data };
}
