/**
 * META MVP 2 — bank document preview (T6.1 frontend).
 * Disabled when NEXT_PUBLIC_FEATURE_DOCUMENT_PREVIEW_UI is false/0/off.
 */
export function isDocumentPreviewUiEnabled(): boolean {
  const v = (process.env.NEXT_PUBLIC_FEATURE_DOCUMENT_PREVIEW_UI ?? "").trim().toLowerCase();
  if (v === "0" || v === "false" || v === "off") return false;
  return true;
}
