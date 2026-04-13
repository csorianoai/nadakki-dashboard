"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, ShieldCheck } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import { useTenant } from "@/contexts/TenantContext";

function detailFromUnknown(json: unknown, fallback: string): string {
  if (!json || typeof json !== "object") return fallback;
  const detail = (json as { detail?: unknown }).detail;
  if (typeof detail === "string") return detail;
  return fallback;
}

function complianceTone(status: string) {
  const normalized = status.toUpperCase();
  if (normalized === "PASS") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (normalized === "WARN") return "bg-amber-500/15 text-amber-200 border-amber-500/30";
  return "bg-rose-500/15 text-rose-200 border-rose-500/30";
}

export default function AdminAuditPage() {
  const { tenantId } = useTenant();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [audit, setAudit] = useState<any>(null);

  const loadAudit = useCallback(async () => {
    if (!tenantId?.trim()) {
      setError("Selecciona un tenant.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/system/audit", {
        method: "GET",
        headers: {
          Accept: "application/json",
          "X-Tenant-ID": tenantId.trim(),
          "X-Role": "admin",
        },
      });
      const json = (await res.json().catch(() => null)) as any;
      if (!res.ok) throw new Error(detailFromUnknown(json, `HTTP ${res.status}`));
      setAudit(json ?? {});
    } catch (e) {
      setError((e as Error).message);
      setAudit(null);
    } finally {
      setLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    void loadAudit();
  }, [loadAudit]);

  const complianceStatus = String(audit?.compliance_status ?? "FAIL");
  const agentsByCore =
    audit?.agents_by_core && typeof audit.agents_by_core === "object"
      ? Object.entries(audit.agents_by_core as Record<string, unknown>)
      : [];
  const warnings = Array.isArray(audit?.warnings) ? (audit.warnings as string[]) : [];
  const rlsActive = Boolean(audit?.isolation?.rls_active);

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin" />

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-indigo-400" />
            System Audit
          </h1>
          <p className="text-gray-400 mt-1">Estado de agentes y tenant isolation.</p>
        </div>
        <button type="button" onClick={() => void loadAudit()} disabled={loading} className="rounded-lg bg-white/10 px-4 py-2 text-sm text-gray-200 inline-flex items-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {loading ? (
        <GlassCard className="p-6">
          <p className="text-sm text-gray-400 m-0 inline-flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Cargando auditoría...
          </p>
        </GlassCard>
      ) : error ? (
        <GlassCard className="p-6 border border-red-500/30">
          <p className="text-sm text-red-400 m-0">{error}</p>
        </GlassCard>
      ) : (
        <div className="space-y-4">
          <GlassCard className="p-6">
            <div className="flex flex-wrap gap-3 items-center mb-4">
              <span className={`inline-flex rounded-md border px-2.5 py-1 text-xs font-semibold ${complianceTone(complianceStatus)}`}>
                {complianceStatus}
              </span>
              <span className="text-sm text-gray-400">Compliance status</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-gray-500 m-0">Agents Total</p>
                <p className="text-2xl text-white font-bold m-0 mt-1">{String(audit?.agents_total ?? 0)}</p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                <p className="text-xs text-gray-500 m-0">Agents Active</p>
                <p className="text-2xl text-white font-bold m-0 mt-1">{String(audit?.agents_active ?? 0)}</p>
              </div>
            </div>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-lg text-white font-semibold mb-3">agents_by_core</h2>
            {agentsByCore.length === 0 ? (
              <p className="text-sm text-gray-500 m-0">No hay datos de cores.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-white/10">
                      <th className="py-2 pr-4">Core</th>
                      <th className="py-2">Count</th>
                    </tr>
                  </thead>
                  <tbody>
                    {agentsByCore.map(([core, count]) => (
                      <tr key={core} className="border-b border-white/5">
                        <td className="py-2 pr-4 text-gray-200">{core}</td>
                        <td className="py-2 text-gray-300">{String(count)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-lg text-white font-semibold mb-3">Tenant Isolation</h2>
            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs border ${rlsActive ? "bg-emerald-500/15 text-emerald-300 border-emerald-500/30" : "bg-rose-500/15 text-rose-200 border-rose-500/30"}`}>
              rls_active: {rlsActive ? "true" : "false"}
            </span>
          </GlassCard>

          <GlassCard className="p-6">
            <h2 className="text-lg text-white font-semibold mb-3">Warnings</h2>
            {warnings.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-amber-200 space-y-1">
                {warnings.map((warning, idx) => (
                  <li key={`${warning}-${idx}`}>{warning}</li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-500 m-0">Sin warnings reportados.</p>
            )}
          </GlassCard>
        </div>
      )}
    </div>
  );
}
