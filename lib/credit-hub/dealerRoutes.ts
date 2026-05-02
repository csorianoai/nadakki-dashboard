/**
 * Canonical root-relative paths for Forge dealer Credit Hub routes.
 *
 * Important: never use a **relative** href such as `dealer/applications/<id>` from a page
 * whose pathname is already `/credit-hub/dealer` — the browser resolves it to
 * `/credit-hub/dealer/dealer/applications/<id>` (double `dealer` segment → 404).
 */

export const FORGE_DEALER_APPLICATIONS_DETAIL_BASE = "/credit-hub/dealer/applications";

/**
 * Absolute (root-relative) URL for a dealer application detail page.
 * Normalizes mistaken `dealer/...` or `applications/...` prefixes on ids.
 */
export function forgeDealerApplicationDetailHref(applicationId: string): string {
  let id = applicationId.trim().replace(/^\/+/, "");
  while (id.toLowerCase().startsWith("dealer/")) {
    id = id.slice("dealer/".length);
  }
  while (id.toLowerCase().startsWith("applications/")) {
    id = id.slice("applications/".length);
  }
  const parts = id.split("/").filter(Boolean);
  if (parts.length > 1) {
    id = parts[parts.length - 1] ?? id;
  }
  return `${FORGE_DEALER_APPLICATIONS_DETAIL_BASE}/${encodeURIComponent(id)}`;
}
