/**
 * URL builders + typed fetch helpers for T6.1 credit document preview endpoints.
 *
 * Runtime notes (medido 2026-08-25 @ 40b996f5, staging
 * https://nadakki-ai-suite-staging.onrender.com /health version):
 * - OpenAPI publica thumbnail, preview.json y /download.
 * - GET .../download con Bearer inválido → 401 invalid_token (ya no 404).
 * - GET .../preview.json|thumbnail con Bearer inválido → 401 (auth antes del 410).
 * - Login banker NO_EJECUTADO: staging ENOIDENTIFIER; api.nadakki.com
 *   "password authentication failed for user nadakki_svc". Sin JWT no se pudo
 *   verificar el cuerpo binario de /download ni el 410 autenticado.
 */

export interface DocumentPreviewMetadata {
  pages?: number;
  page_count?: number;
  title?: string;
  /** Preferred relative path (joined with {@link creditApiBase}) or absolute URL for the PDF asset. */
  stream_path?: string;
  mime_type?: string;
  etag?: string;
  pdf_url?: string;
  source_url?: string;
  file_url?: string;
  [key: string]: unknown;
}

export function creditApiBase(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL?.trim();
  return (raw ?? "").replace(/\/+$/, "");
}

export function bankPreviewJsonUrl(applicationId: string, documentId: string): string {
  const b = creditApiBase();
  return `${b}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(documentId)}/preview.json`;
}

export function bankDocumentThumbnailUrl(
  applicationId: string,
  documentId: string,
  page: number = 1
): string {
  const b = creditApiBase();
  return `${b}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(documentId)}/thumbnail?page=${page}`;
}

/** Canonical download path (backend #1030). Fallback when metadata has no stream URL. */
export function bankDocumentDownloadUrl(applicationId: string, documentId: string): string {
  const b = creditApiBase();
  return `${b}/api/v2/credit/applications/${encodeURIComponent(applicationId)}/documents/${encodeURIComponent(documentId)}/download`;
}

export function buildPreviewFetchInit(
  tenantId: string,
  authToken: string | undefined,
  overrides: RequestInit = {}
): RequestInit {
  const headers = new Headers(overrides.headers as HeadersInit | undefined);
  headers.set("X-Tenant-ID", tenantId.trim());
  if (!headers.has("Accept")) headers.set("Accept", "*/*");
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`);

  return {
    ...overrides,
    credentials: authToken ? "omit" : "include",
    cache: overrides.cache ?? "default",
    headers,
  };
}

/**
 * Resolve usable PDF GET URL — metadata override or deterministic download endpoint.
 *
 * medido 2026-08-25 @ 40b996f5: preview.json sigue en OpenAPI con query `token`
 * HMAC; el router desplegado responde 410 PREVIEW_DISABLED cuando
 * NADAKKI_DOCUMENT_PREVIEW_ENABLED está off (auth JWT se evalúa antes — sin
 * token de banker no se observó el 410 en runtime). /download ya no es 404:
 * montado por #1030 (OpenAPI + 401 invalid_token con Bearer inválido).
 */
export function resolvePdfSourceUrl(
  metadata: DocumentPreviewMetadata | null,
  applicationId: string,
  documentId: string
): string {
  const candidate = metadata?.stream_path ?? metadata?.pdf_url ?? metadata?.source_url ?? metadata?.file_url;
  if (candidate && typeof candidate === "string") {
    if (/^https?:\/\//i.test(candidate)) return candidate;
    const base = creditApiBase();
    return `${base}${candidate.startsWith("/") ? "" : "/"}${candidate}`;
  }
  return bankDocumentDownloadUrl(applicationId, documentId);
}

/** Warm CDN/browser cache via GET thumbnail — body discarded */
export async function warmThumbnailCache(
  applicationId: string,
  documentId: string,
  tenantId: string,
  options: {
    authToken?: string;
    page?: number;
    signal?: AbortSignal;
  } = {}
): Promise<void> {
  const url = bankDocumentThumbnailUrl(applicationId, documentId, options.page ?? 1);
  const res = await fetch(
    url,
    buildPreviewFetchInit(tenantId, options.authToken, {
      signal: options.signal,
      headers: { Accept: "image/*,*/*" },
      cache: "default",
    })
  );
  if (res.ok) {
    await res.arrayBuffer();
  }
}
