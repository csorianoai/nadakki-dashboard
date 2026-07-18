/** Autos portal DOM scope — theme/tenant attrs stay off documentElement. */

export const AUTOS_PORTAL_SELECTOR = '[data-portal="autos"]';

export function getAutosPortalElement(): HTMLElement | null {
  if (typeof document === "undefined") return null;
  return document.querySelector(AUTOS_PORTAL_SELECTOR);
}

/** Remove legacy global attrs written before the scope fix (PR #328). */
export function cleanupLegacyAutosDocumentAttrs(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.removeAttribute("data-theme");
  root.removeAttribute("data-tenant");
  root.removeAttribute("data-portal");
}

export function readAutosPortalSurfaceAttrs(): {
  theme: string;
  tenant: string | null;
} {
  const el = getAutosPortalElement();
  return {
    theme: el?.getAttribute("data-theme") ?? "light",
    tenant: el?.getAttribute("data-tenant") ?? null,
  };
}
