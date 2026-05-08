import type { MockUploadApiResponse, UploadedFile } from "@/lib/shared/document-upload-types";

const UPLOAD_PATH = "/api/v1/legal/documents/upload";

/** Une los resúmenes de texto extraído (mock o real) para enviarlo a APIs que aún esperan string. */
export function mergePlainFromUploads(files: UploadedFile[]): string {
  return files
    .filter((f) => f.status === "ready")
    .map((f) => f.extractedData?.plain_text_summary?.trim())
    .filter(Boolean)
    .join("\n\n---\n\n");
}

function delay(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Sube un archivo al endpoint (mock o real). Progreso simulado durante la petición. */
export async function uploadLegalDocument(
  file: File,
  onProgress?: (pct: number) => void
): Promise<MockUploadApiResponse> {
  const formData = new FormData();
  formData.append("file", file);

  let pct = 0;
  const tick = setInterval(() => {
    pct = Math.min(pct + 7 + Math.random() * 8, 92);
    onProgress?.(Math.round(pct));
  }, 160);

  try {
    const res = await fetch(UPLOAD_PATH, {
      method: "POST",
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      const msg =
        typeof err === "object" && err && "error" in err
          ? String((err as { error?: { message?: string } }).error?.message ?? res.statusText)
          : `Error HTTP ${res.status}`;
      throw new Error(msg);
    }
    const data = (await res.json()) as MockUploadApiResponse;
    onProgress?.(96);
    await delay(400);
    onProgress?.(100);
    return data;
  } finally {
    clearInterval(tick);
  }
}
