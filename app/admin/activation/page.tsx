"use client";

import { useState, useEffect } from "react";
import { motion } from "@/lib/motion-stub";
import { Loader2, Zap, CheckCircle2, AlertTriangle } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusChip from "@/components/admin/StatusChip";
import GapList from "@/components/admin/GapList";
import NextActionsPanel from "@/components/admin/NextActionsPanel";
import { useTenant } from "@/contexts/TenantContext";
import { postTenantActivate, suiteFailure } from "@/lib/api/suiteOps";
import { getActivationGaps, getNextActions } from "@/lib/adminContracts";

export default function AdminActivationPage() {
  const { tenantId, setTenantId } = useTenant();
  const [inputId, setInputId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    if (tenantId) setInputId(tenantId);
  }, [tenantId]);

  const effectiveId = inputId.trim();

  const run = async () => {
    setError(null);
    setResult(null);
    if (!effectiveId) {
      setError("Enter a tenant id (slug) that has a saved profile.");
      return;
    }
    setLoading(true);
    const r = await postTenantActivate(effectiveId, false);
    setLoading(false);
    const fail = suiteFailure(r);
    if (fail) {
      setError(fail.error);
      return;
    }
    if (r.ok) setResult(r.data);
  };

  const status = result?.activation_status as string | undefined;
  const score = result?.readiness_score as number | undefined;
  const checks = (result?.readiness_checks as Array<Record<string, unknown>> | undefined) ?? [];
  const gaps = getActivationGaps(result);
  const nextActions = getNextActions(result);

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin" />

      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white">Tenant activation</h1>
        <p className="text-gray-400 mt-1 max-w-2xl">
          Runs <code className="text-gray-500">POST /api/v1/tenants/activate</code> — dry-run pipeline checks and readiness
          scoring. Requires <code className="text-gray-500">data/tenants/&lt;id&gt;/profile.json</code> on the server.
        </p>
      </motion.div>

      <GlassCard className="p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4 md:items-end">
          <label className="flex-1 block">
            <span className="text-xs text-gray-500">Tenant ID</span>
            <input
              className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm"
              value={inputId}
              onChange={(e) => setInputId(e.target.value)}
              placeholder="my-tenant-slug"
            />
          </label>
          <button
            type="button"
            onClick={() => {
              if (effectiveId) setTenantId(effectiveId);
            }}
            className="px-3 py-2 text-sm rounded-lg border border-white/10 text-gray-400 hover:text-white"
          >
            Use as context tenant
          </button>
          <button
            type="button"
            onClick={() => void run()}
            disabled={loading}
            className="px-6 py-2.5 rounded-lg bg-amber-500/90 hover:bg-amber-500 text-white font-medium flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {loading ? "Running readiness checks…" : "Run activation"}
          </button>
        </div>
        {error && (
          <p className="text-red-400 text-sm mt-4 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            {error}
          </p>
        )}
      </GlassCard>

      {!result && !loading && !error && (
        <GlassCard className="p-6 mb-6 border border-white/10">
          <p className="text-sm text-gray-300 m-0">
            Activation has not been run yet. Enter a tenant slug and execute to see readiness status, activation gaps, and
            operational next actions.
          </p>
        </GlassCard>
      )}

      {result && (
        <div className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              {status === "READY" || status === "ACTIVE_READY" ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              ) : (
                <AlertTriangle className="w-8 h-8 text-amber-400" />
              )}
              <div>
                <StatusChip status={status} />
                <h2 className="text-xl font-bold text-white mt-2 mb-0">{status ?? "Unknown"}</h2>
                <p className="text-gray-400 text-sm m-0">
                  Readiness score:{" "}
                  <span className="text-white font-mono">{score != null ? `${score}%` : "—"}</span>
                </p>
              </div>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GapList gaps={gaps} />
            <NextActionsPanel actions={nextActions} />
          </div>

          <GlassCard className="p-6">
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Readiness checks</h3>
            {checks.length === 0 ? (
              <p className="text-sm text-gray-500">No readiness_checks were returned for this run.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-white/10">
                      <th className="py-2 pr-4">Check</th>
                      <th className="py-2 pr-4">Passed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checks.map((c, i) => (
                      <tr key={i} className="border-b border-white/5">
                        <td className="py-2 pr-4 text-gray-300 font-mono text-xs">{String(c.check ?? "")}</td>
                        <td className="py-2 text-gray-400">{c.passed ? "yes" : "no"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </GlassCard>

        </div>
      )}
    </div>
  );
}
