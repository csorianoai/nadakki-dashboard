"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import {
  getUsage,
  type TenantUsagePayload,
  usageConsumedValue,
  usageLimitValue,
  usagePercent,
  usageProgressToneClass,
} from "@/lib/api/usage";
import { Activity, AlertCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

export interface UsageDashboardProps {
  /** Overrides context tenant when provided (e.g. CreditTenantGate) */
  tenantId?: string | null;
  /** `'dark'` for dealer-style pages (slate on dark shell) */
  variant?: "default" | "dark";
}

export default function UsageDashboard({
  tenantId: tenantIdProp,
  variant = "default",
}: UsageDashboardProps) {
  const { tenantId: ctxTenant } = useTenant();
  const { plan: authPlan } = useAuth();
  const tenantId = (tenantIdProp ?? ctxTenant ?? "").trim();

  const [data, setData] = useState<TenantUsagePayload | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!tenantId) {
      setData(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    const u = await getUsage(tenantId);
    setData(u);
    setLoading(false);
  }, [tenantId]);

  useEffect(() => {
    void load();
  }, [load]);

  const used = usageConsumedValue(data);
  const limit = usageLimitValue(data);
  const pct = usagePercent(used, limit);
  const planLabel =
    (data?.plan && String(data.plan).trim()) ||
    (data?.plan_name && String(data.plan_name).trim()) ||
    (authPlan && String(authPlan).trim()) ||
    "—";

  const remaining =
    limit != null && used != null
      ? Math.max(0, Math.floor(limit - used))
      : null;

  const isDark = variant === "dark";
  const cardClass = isDark
    ? "rounded-xl border border-white/10 bg-white/[0.04] p-5 text-slate-100"
    : "rounded-2xl border border-gray-200 bg-white p-5 shadow-sm text-gray-900";

  if (!tenantId) {
    return (
      <div
        className={`${cardClass} text-sm opacity-80`}
        role="status"
      >
        Selecciona un tenant para ver el uso del plan.
      </div>
    );
  }

  if (loading) {
    return (
      <div className={`${cardClass} animate-pulse h-28`} aria-busy="true" />
    );
  }

  if (!data || (used == null && limit == null)) {
    return (
      <div
        className={`${cardClass} flex items-start gap-2 text-sm ${
          isDark ? "text-slate-400" : "text-gray-600"
        }`}
        role="status"
      >
        <AlertCircle className="w-5 h-5 shrink-0 opacity-70" />
        <span>
          No hay datos de uso disponibles para este tenant. Vuelve a intentar
          más tarde o revisa la configuración del API.
        </span>
      </div>
    );
  }

  const barClass =
    pct != null ? usageProgressToneClass(pct) : "bg-gray-300 dark:bg-slate-600";

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Activity
            className={`w-5 h-5 ${isDark ? "text-violet-400" : "text-blue-600"}`}
          />
          <h2 className="text-base font-semibold">Uso del plan</h2>
        </div>
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            isDark
              ? "bg-white/10 text-slate-300"
              : "bg-gray-100 text-gray-700"
          }`}
        >
          Plan: {planLabel}
        </span>
      </div>

      <div
        className={`grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm mb-4 ${
          isDark ? "text-slate-300" : "text-gray-700"
        }`}
      >
        <div>
          <p className={`text-xs ${isDark ? "text-slate-500" : "text-gray-500"}`}>
            Uso actual
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {used != null ? used.toLocaleString("es-DO") : "—"}
          </p>
        </div>
        <div>
          <p className={`text-xs ${isDark ? "text-slate-500" : "text-gray-500"}`}>
            Límite
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {limit != null ? limit.toLocaleString("es-DO") : "—"}
          </p>
        </div>
        <div>
          <p className={`text-xs ${isDark ? "text-slate-500" : "text-gray-500"}`}>
            % usado
          </p>
          <p className="text-lg font-semibold tabular-nums">
            {pct != null ? `${pct.toFixed(1)}%` : "—"}
          </p>
        </div>
      </div>

      {pct != null && (
        <div
          className={`h-3 rounded-full overflow-hidden mb-3 ${
            isDark ? "bg-white/10" : "bg-gray-100"
          }`}
        >
          <div
            className={`h-full rounded-full transition-all duration-500 ${barClass}`}
            style={{ width: `${Math.min(100, pct)}%` }}
            role="progressbar"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      )}

      {remaining !== null && limit != null && limit > 0 && (
        <div
          className={`rounded-lg px-3 py-2 text-sm font-medium ${
            isDark
              ? "bg-violet-500/15 text-violet-200 border border-violet-500/30"
              : "bg-blue-50 text-blue-900 border border-blue-100"
          }`}
          role="status"
        >
          Te quedan {remaining.toLocaleString("es-DO")} evaluaciones este mes
        </div>
      )}
    </div>
  );
}
