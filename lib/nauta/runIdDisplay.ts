/** Truncate run UUID for breadcrumbs and lineage (supervisor-readable). */
export function truncateRunId(runId: string, visible = 8): string {
  const trimmed = runId.trim();
  if (!trimmed) return "—";
  if (trimmed.length <= visible) return trimmed;
  return `${trimmed.slice(0, visible)}…`;
}

export function nautaRunDetailHref(runId: string): string {
  return `/nauta/runs/${encodeURIComponent(runId.trim())}`;
}
