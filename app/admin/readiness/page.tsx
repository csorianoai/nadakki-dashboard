"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, Gauge, Building2, AlertTriangle } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import GlassCard from "@/components/ui/GlassCard";
import StatusChip from "@/components/admin/StatusChip";
import GapList from "@/components/admin/GapList";
import NextActionsPanel from "@/components/admin/NextActionsPanel";
import { useTenant } from "@/contexts/TenantContext";
import {
  getTenantReadiness,
  getFleetReadiness,
  getOpsOnboardingHealth,
  suiteFailure,
} from "@/lib/api/suiteOps";
import { getActivationGaps, getNextActions } from "@/lib/adminContracts";

type Tab = "tenant" | "fleet";

export default function AdminReadinessPage() {
  const { tenantId } = useTenant();
  const [tab, setTab] = useState<Tab>("tenant");
  const [manualId, setManualId] = useState("");

  const [opsLoading, setOpsLoading] = useState(true);
  const [opsErr, setOpsErr] = useState<string | null>(null);
  const [ops, setOps] = useState<Record<string, unknown> | null>(null);

  const [singleLoading, setSingleLoading] = useState(false);
  const [singleErr, setSingleErr] = useState<string | null>(null);
  const [single, setSingle] = useState<Record<string, unknown> | null>(null);

  const [fleetLoading, setFleetLoading] = useState(false);
  const [fleetErr, setFleetErr] = useState<string | null>(null);
  const [fleet, setFleet] = useState<Record<string, unknown> | null>(null);

  const effectiveId = (tenantId || manualId).trim();

  useEffect(() => {
    let alive = true;
    (async () => {
      setOpsLoading(true);
      setOpsErr(null);
      const r = await getOpsOnboardingHealth();
      if (!alive) return;
      const of = suiteFailure(r);
      if (of) setOpsErr(of.error);
      else if (r.ok) setOps(r.data);
      setOpsLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const loadSingle = async () => {
    setSingleErr(null);
    setSingle(null);
    if (!effectiveId) {
      setSingleErr("Enter tenant id or set context tenant.");
      return;
    }
    setSingleLoading(true);
    const r = await getTenantReadiness(effectiveId);
    setSingleLoading(false);
    const tf = suiteFailure(r);
    if (tf) {
      setSingleErr(tf.error);
      return;
    }
    if (r.ok) setSingle(r.data);
  };

  const loadFleet = async () => {
    setFleetErr(null);
    setFleet(null);
    setFleetLoading(true);
    const r = await getFleetReadiness();
    setFleetLoading(false);
    const ff = suiteFailure(r);
    if (ff) {
      setFleetErr(ff.error);
      return;
    }
    if (r.ok) setFleet(r.data);
  };

  useEffect(() => {
    if (tab === "fleet" && !fleet && !fleetLoading) void loadFleet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  useEffect(() => {
    if (tenantId) setManualId(tenantId);
  }, [tenantId]);

  const checks = (single?.checks as Array<Record<string, unknown>> | undefined) ?? [];
  const gaps = getActivationGaps(single);
  const nextActions = getNextActions(single);
  const fleetRows = (fleet?.tenants as Array<Record<string, unknown>> | undefined) ?? [];

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/admin" />

      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Gauge className="w-8 h-8 text-cyan-400" />
          Tenant readiness
        </h1>
        <p className="text-gray-400 mt-1">
          <code className="text-gray-500">GET /api/v1/ops/onboarding/readiness/…</code> — server-side scoring from saved
          profiles (no mock data).
        </p>
      </motion.div>

      <GlassCard className="p-4 mb-6">
        {opsLoading ? (
          <div className="flex items-center gap-2 text-gray-400 text-sm">
            <Loader2 className="w-4 h-4 animate-spin" /> Ops health…
          </div>
        ) : opsErr ? (
          <p className="text-red-400 text-sm m-0">Ops health failed: {opsErr}</p>
        ) : (
          <p className="text-sm text-gray-400 m-0">
            Fleet snapshot:{" "}
            <span className="text-white">
              {String(ops?.fleet_ready ?? "—")} / {String(ops?.fleet_total ?? "—")} ready · avg score{" "}
              {String(ops?.fleet_avg_score ?? "—")}
            </span>
          </p>
        )}
      </GlassCard>

      <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
        <button
          type="button"
          onClick={() => setTab("tenant")}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium ${
            tab === "tenant" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          Single tenant
        </button>
        <button
          type="button"
          onClick={() => setTab("fleet")}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium flex items-center gap-2 ${
            tab === "fleet" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"
          }`}
        >
          <Building2 className="w-4 h-4" /> Fleet
        </button>
      </div>

      {tab === "tenant" && (
        <GlassCard className="p-6">
          <div className="flex flex-col md:flex-row gap-4 md:items-end mb-6">
            <label className="flex-1 block">
              <span className="text-xs text-gray-500">Tenant ID</span>
              <input
                className="mt-1 w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white font-mono text-sm"
                value={manualId}
                onChange={(e) => setManualId(e.target.value)}
                placeholder="slug"
              />
            </label>
            <button
              type="button"
              onClick={() => void loadSingle()}
              disabled={singleLoading}
              className="px-5 py-2.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white flex items-center gap-2 disabled:opacity-50"
            >
              {singleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {singleLoading ? "Loading readiness…" : "Load readiness"}
            </button>
          </div>
          {singleErr && <p className="text-red-400 text-sm mb-4">{singleErr}</p>}
          {!single && !singleLoading && !singleErr && (
            <p className="text-sm text-gray-400 mb-4">
              Readiness data is empty. Enter a tenant and load to inspect score, checks, and action plan.
            </p>
          )}
          {single && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-baseline gap-4">
                <span className="text-3xl font-bold text-white">{String(single.readiness_score ?? "—")}</span>
                <span className="text-gray-400">/ 100</span>
                <StatusChip status={single.status} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <GapList gaps={gaps} emptyMessage="No activation_gaps for this tenant." />
                <NextActionsPanel actions={nextActions} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-gray-500 border-b border-white/10">
                      <th className="py-2 pr-4">Check</th>
                      <th className="py-2 pr-4">Passed</th>
                      <th className="py-2">Weight</th>
                    </tr>
                  </thead>
                  {checks.length > 0 ? (
                    <tbody>
                      {checks.map((c, i) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="py-2 pr-4 font-mono text-xs text-gray-300">{String(c.check ?? "")}</td>
                          <td className="py-2 pr-4">{c.passed ? "yes" : "no"}</td>
                          <td className="py-2 text-gray-500">{String(c.weight ?? "")}</td>
                        </tr>
                      ))}
                    </tbody>
                  ) : null}
                </table>
                {checks.length === 0 && (
                  <p className="text-sm text-gray-500 mt-3">No check details were returned for this tenant.</p>
                )}
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {tab === "fleet" && (
        <GlassCard className="p-6">
          {fleetLoading ? (
            <div className="flex items-center gap-2 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" /> Loading fleet readiness…
            </div>
          ) : fleetErr ? (
            <p className="text-red-400 text-sm">{fleetErr}</p>
          ) : fleet ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-500 m-0">Fleet total</p>
                  <p className="text-xl text-white m-0">{String(fleet.total ?? fleetRows.length ?? "—")}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-500 m-0">Ready</p>
                  <p className="text-xl text-emerald-300 m-0">{String(fleet.ready ?? fleet.fleet_ready ?? "—")}</p>
                </div>
                <div className="rounded-lg border border-white/10 bg-white/5 p-3">
                  <p className="text-xs text-gray-500 m-0">Avg score</p>
                  <p className="text-xl text-white m-0">{String(fleet.avg_score ?? fleet.fleet_avg_score ?? "—")}</p>
                </div>
              </div>
              {fleetRows.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-white/10">
                        <th className="py-2 pr-4">Tenant</th>
                        <th className="py-2 pr-4">Status</th>
                        <th className="py-2">Score</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fleetRows.map((row, i) => {
                        return (
                          <tr key={`${row.tenant_id ?? i}`} className="border-b border-white/5">
                            <td className="py-2 pr-4 text-gray-200 font-mono text-xs">{String(row.tenant_id ?? "—")}</td>
                            <td className="py-2 pr-4">
                              <StatusChip status={row.status} size="sm" />
                            </td>
                            <td className="py-2 text-gray-300">{String(row.readiness_score ?? "—")}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-sm text-gray-500 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  No tenant rows in fleet payload.
                </p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No data.</p>
          )}
          <button
            type="button"
            onClick={() => void loadFleet()}
            className="mt-4 text-sm text-cyan-400 hover:underline"
          >
            Refresh fleet
          </button>
        </GlassCard>
      )}
    </div>
  );
}
