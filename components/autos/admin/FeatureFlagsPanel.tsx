"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { DemoModeBadge } from "@/components/search/DemoModeBadge";
import {
  AutosAdminApiError,
  fetchFeatureFlags,
  setFeatureFlag,
} from "@/lib/autos-portal/admin-api";
import { loadAdminFlags, saveAdminFlags } from "@/lib/autos-portal/admin-session-store";
import {
  AUTOS_FEATURE_FLAG_KEYS,
  DEFAULT_AUTOS_FEATURE_FLAGS,
  type AutosFeatureFlagKey,
  type AutosFeatureFlags,
} from "@/lib/autos-portal/admin-types";
import { TENANTS, type TenantSlug } from "@/lib/tenants";

const FLAG_LABELS: Record<AutosFeatureFlagKey, string> = {
  financing: "Financiamiento (Credit Hub bridge)",
  compare: "Comparar vehículos",
  share: "Compartir carrito / comparación",
  leads: "Captura de leads / mis-leads",
};

export function FeatureFlagsPanel({ tenantSlug }: { tenantSlug: TenantSlug }) {
  const tenantId = TENANTS[tenantSlug].tenantId;
  const [flags, setFlags] = useState<AutosFeatureFlags>(DEFAULT_AUTOS_FEATURE_FLAGS);
  const [loading, setLoading] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [busyKey, setBusyKey] = useState<AutosFeatureFlagKey | null>(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const remote = await fetchFeatureFlags(tenantId);
      setFlags(remote);
      saveAdminFlags(tenantId, remote);
      setDemoMode(false);
    } catch (e) {
      if (e instanceof AutosAdminApiError && e.status === 404) {
        setFlags(loadAdminFlags(tenantId));
        setDemoMode(true);
      } else {
        setFlags(loadAdminFlags(tenantId));
        setDemoMode(true);
      }
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const toggle = async (key: AutosFeatureFlagKey) => {
    const next = !flags[key];
    setBusyKey(key);
    try {
      await setFeatureFlag(tenantId, key, next);
      const updated = { ...flags, [key]: next };
      setFlags(updated);
      saveAdminFlags(tenantId, updated);
      toast.success(`Flag ${key} ${next ? "activado" : "desactivado"}`);
    } catch (e) {
      if (e instanceof AutosAdminApiError && e.status === 404) {
        const updated = { ...flags, [key]: next };
        setFlags(updated);
        saveAdminFlags(tenantId, updated);
        toast.message("Modo demo — flag guardado localmente");
      } else {
        toast.error(e instanceof Error ? e.message : "No se pudo actualizar flag");
      }
    } finally {
      setBusyKey(null);
    }
  };

  if (loading) {
    return <p className="text-sm text-gray-500">Cargando feature flags…</p>;
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="mb-4 flex items-center gap-2">
        <h2 className="text-lg font-bold text-gray-900">Feature flags — {TENANTS[tenantSlug].name}</h2>
        <DemoModeBadge visible={demoMode} />
      </div>
      <ul className="space-y-4">
        {AUTOS_FEATURE_FLAG_KEYS.map((key) => (
          <li key={key} className="flex items-center justify-between gap-4 border-b border-gray-100 pb-3 last:border-0">
            <div>
              <p className="font-medium capitalize">{key}</p>
              <p className="text-xs text-gray-500">{FLAG_LABELS[key]}</p>
            </div>
            <input
              type="checkbox"
              checked={flags[key]}
              disabled={busyKey === key}
              onChange={() => void toggle(key)}
              className="h-4 w-4 rounded border-gray-300"
              aria-label={`Toggle ${key}`}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
