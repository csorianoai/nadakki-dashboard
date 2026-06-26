/**
 * Cosmetic-only RBAC helper for hearings write actions (create / change status).
 *
 * AUTHORITY IS THE BACKEND 403 — this helper only decides whether to show the
 * write controls for a nicer UX. Per project guidance: a button that returns 403
 * is better than a button hidden by guessing the wrong role_key.
 *
 * Interpretation of the guidance:
 *  - No role data at all (empty/unknown) → SHOW (don't hide on uncertainty).
 *  - Has a clearly-authorizing role_key → SHOW.
 *  - Has roles but none clearly authorize → HIDE (cosmetic; backend 403 still governs).
 *
 * The literals "attorney"/"paralegal" are NOT real frontend role_keys today; they
 * are included defensively in case the backend role model is mirrored later.
 */
const HEARING_WRITE_ROLE_KEYS: ReadonlySet<string> = new Set([
  "platform_superadmin",
  "tenant_admin",
  "legal_admin",
  "admin",
  "attorney",
  "paralegal",
]);

export function canManageHearings(
  allRoles: ReadonlyArray<{ role_key: string }> | null | undefined,
): boolean {
  if (!allRoles || allRoles.length === 0) return true;
  return allRoles.some((r) => HEARING_WRITE_ROLE_KEYS.has(r.role_key));
}
