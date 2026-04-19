"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GoogleAdsTenantReadinessCard from "@/components/tenants/GoogleAdsTenantReadinessCard";
import {
  getGoogleAdsTenantReadiness,
  refreshGoogleAdsTenantReadiness,
  type GoogleAdsTenantReadinessPayload,
} from "@/lib/api/googleAdsTenantReadiness";
import { suiteFailure } from "@/lib/api/suiteOps";

export default function TenantDetailPage() {
  const params = useParams();
  const tenantId = typeof params?.tenantId === "string" ? params.tenantId : "";

  const [data, setData] = useState<GoogleAdsTenantReadinessPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!tenantId) return;
    setError(null);
    const r = await getGoogleAdsTenantReadiness(tenantId);
    const f = suiteFailure(r);
    if (f) {
      setError(f.error);
      setData(null);
      return;
    }
    if (r.ok) setData(r.data);
  }, [tenantId]);

  useEffect(() => {
    setLoading(true);
    void load().finally(() => setLoading(false));
  }, [load]);

  const handleRefresh = async () => {
    if (!tenantId) return;
    setRefreshing(true);
    setError(null);
    const r = await refreshGoogleAdsTenantReadiness(tenantId);
    const f = suiteFailure(r);
    setRefreshing(false);
    if (f) {
      setError(f.error);
      return;
    }
    if (r.ok) setData(r.data);
  };

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/tenants">
        <Link
          href="/tenants"
          className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white"
        >
          <ArrowLeft className="w-4 h-4" /> Tenants
        </Link>
      </NavigationBar>

      <div className="mb-8 flex items-center gap-3">
        <div className="p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/25">
          <Building2 className="w-8 h-8 text-emerald-400" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-white m-0">Tenant</h1>
          <p className="text-slate-400 m-0 text-sm font-mono">{tenantId || "—"}</p>
        </div>
      </div>

      {tenantId ? (
        <GoogleAdsTenantReadinessCard
          tenantId={tenantId}
          data={data}
          loading={loading}
          error={error}
          onRefresh={() => void handleRefresh()}
          refreshing={refreshing}
        />
      ) : (
        <p className="text-slate-500">Invalid tenant route.</p>
      )}
    </div>
  );
}
