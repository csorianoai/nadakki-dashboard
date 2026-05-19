/**
 * Deadline must parse and be strictly after current instant (META: fail-closed UX).
 */
export function deadlineIsValidFuture(deadline: string | undefined, nowMs: number): boolean {
  if (deadline == null || deadline === "") return true;
  const t = Date.parse(deadline);
  if (!Number.isFinite(t)) return false;
  return t > nowMs;
}
