"use client";

import {
  CORE_NAV_CAPABILITY_KEYS,
  isAccessQueryFailClosed,
} from "@/components/dealer/CoreNavigation";
import { useAccessEntitlementsBatch } from "@/lib/access/hooks";

interface UsageMetrics {
  [capability_id: string]: {
    used: number;
    limit: number | null;
    percentage: number;
  };
}

export function UsageMeter() {
  const query = useAccessEntitlementsBatch(CORE_NAV_CAPABILITY_KEYS);
  const failClosed = isAccessQueryFailClosed(query);

  if (query.isPending || query.isLoading) {
    return <p className="animate-pulse text-sm text-nk-fg-muted">Cargando uso…</p>;
  }

  if (failClosed) {
    return <p className="text-sm text-nk-fg-muted">Sin datos de uso este mes.</p>;
  }

  const usage: UsageMetrics = {};
  for (const [capId, item] of Object.entries(query.data?.results ?? {})) {
    const limit = item.limit ?? null;
    const used = item.current_usage ?? 0;
    const percentage = limit && limit > 0 ? Math.min(100, (used / limit) * 100) : 0;
    usage[capId] = { used, limit, percentage };
  }

  if (Object.keys(usage).length === 0) {
    return <p className="text-sm text-nk-fg-muted">Sin datos de uso este mes.</p>;
  }

  return (
    <div className="space-y-4">
      {Object.entries(usage).map(([capId, data]) => (
        <div key={capId} className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="font-medium text-nk-fg">{formatCapabilityName(capId)}</span>
            <span className="text-nk-fg-muted">
              {data.used}
              {data.limit != null ? `/${data.limit}` : "/∞"}
            </span>
          </div>

          {data.limit != null ? (
            <div className="h-2 w-full rounded-full bg-nk-surface-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  data.percentage >= 80
                    ? "bg-red-600"
                    : data.percentage >= 50
                      ? "bg-yellow-500"
                      : "bg-green-600"
                }`}
                style={{ width: `${data.percentage}%` }}
              />
            </div>
          ) : null}

          {data.limit != null && data.percentage >= 80 ? (
            <p className="text-xs font-semibold text-red-600">
              ⚠️ {100 - Math.round(data.percentage)}% restante
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function formatCapabilityName(capId: string): string {
  return capId
    .split(".")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
