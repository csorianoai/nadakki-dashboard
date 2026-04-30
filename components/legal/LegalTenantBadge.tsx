"use client";

export function LegalTenantBadge({ tenantId }: { tenantId: string | undefined }) {
  if (!tenantId) {
    return (
      <span className="rounded-full border border-amber-300 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-900 dark:border-amber-700 dark:bg-amber-950 dark:text-amber-100">
        Tenant: pendiente
      </span>
    );
  }
  const short = tenantId.length > 12 ? `${tenantId.slice(0, 8)}…` : tenantId;
  return (
    <span
      className="rounded-full border border-slate-200 bg-white px-3 py-1 font-mono text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      title={tenantId}
    >
      Tenant: {short}
    </span>
  );
}
