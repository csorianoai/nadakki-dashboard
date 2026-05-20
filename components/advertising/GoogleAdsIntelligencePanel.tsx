"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";
import { apiFetch } from "@/lib/api/fetch-client";

const FALLBACK_TENANT = "sf-rentals-nadaki-excursions";

function unwrap(json: unknown): unknown {
  if (!json || typeof json !== "object") return json;
  const o = json as Record<string, unknown>;
  if (o.data !== undefined) return o.data;
  return json;
}

type ModuleRow = { id: string; title: string; status: string };

function normalizeModuleItem(x: unknown): ModuleRow {
  if (x && typeof x === "object") {
    const r = x as Record<string, unknown>;
    const id = String(r.id ?? r.module_id ?? r.code ?? "?").toLowerCase();
    const title = String(r.title ?? r.name ?? r.label ?? id.toUpperCase());
    const status = String(r.status ?? r.state ?? "unknown");
    return { id, title, status };
  }
  return { id: "?", title: "", status: "unknown" };
}

function extractModules(raw: unknown): ModuleRow[] {
  const u = unwrap(raw);
  if (!u) return [];
  if (Array.isArray(u)) return u.map(normalizeModuleItem);
  if (typeof u === "object" && u !== null) {
    const o = u as Record<string, unknown>;
    if (Array.isArray(o.modules)) return o.modules.map(normalizeModuleItem);
    if (Array.isArray(o.items)) return o.items.map(normalizeModuleItem);
    const keys = Object.keys(o)
      .filter((k) => /^m\d{1,2}$/i.test(k))
      .sort((a, b) => {
        const na = parseInt(a.replace(/^m/i, ""), 10);
        const nb = parseInt(b.replace(/^m/i, ""), 10);
        return na - nb;
      });
    if (keys.length)
      return keys.map((k) => normalizeModuleItem({ id: k, ...(o[k] as Record<string, unknown>) }));
  }
  return [];
}

function statusPillClass(s: string) {
  const v = s.toLowerCase();
  if (v === "completed" || v === "pass" || v === "ok" || v === "healthy")
    return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
  if (v === "ready" || v === "eligible") return "bg-blue-500/15 text-blue-400 border-blue-500/30";
  if (v === "in_progress" || v === "running") return "bg-indigo-500/15 text-indigo-400 border-indigo-500/30";
  if (v === "not_ready" || v === "warn" || v === "warning") return "bg-amber-500/15 text-amber-400 border-amber-500/30";
  if (v === "blocked" || v === "fail" || v === "critical") return "bg-rose-500/15 text-rose-400 border-rose-500/30";
  return "bg-slate-700/50 text-slate-400 border-slate-600/50";
}

function readinessFromModules(rows: ModuleRow[]) {
  if (!rows.length) return { pct: null as number | null, label: "No module data" };
  const completed = rows.filter((r) => r.status.toLowerCase() === "completed").length;
  const ready = rows.filter((r) => r.status.toLowerCase() === "ready").length;
  const blocked = rows.filter((r) => r.status.toLowerCase() === "blocked").length;
  const pct = Math.round(((completed * 2 + ready) / (rows.length * 2)) * 100);
  return {
    pct,
    label: `${completed} completed · ${ready} ready · ${blocked} blocked · ${rows.length} modules`,
  };
}

export default function GoogleAdsIntelligencePanel() {
  const { tenantId } = useTenant();
  const effectiveTenant = tenantId?.trim() || FALLBACK_TENANT;
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modulesPayload, setModulesPayload] = useState<unknown>(null);
  const [fitPayload, setFitPayload] = useState<unknown>(null);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setErr(null);
    try {
      const headers = { Accept: "application/json", "X-Tenant-ID": effectiveTenant };
      const [modRes, fitRes] = await Promise.all([
        apiFetch("/api/v1/google-ads/modules/status", { cache: "no-store", headers }),
        apiFetch("/api/v1/google-ads/fundamentals/evaluate-fit", {
          method: "POST",
          cache: "no-store",
          headers: { ...headers, "Content-Type": "application/json" },
          body: JSON.stringify({ tenant_id: effectiveTenant }),
        }),
      ]);
      if (modRes.ok) setModulesPayload(await modRes.json());
      else setModulesPayload({ error: `modules/status HTTP ${modRes.status}` });
      if (fitRes.ok) setFitPayload(await fitRes.json());
      else setFitPayload({ error: `evaluate-fit HTTP ${fitRes.status}` });
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, [effectiveTenant]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const moduleRows = useMemo(() => extractModules(modulesPayload), [modulesPayload]);
  const readiness = useMemo(() => readinessFromModules(moduleRows), [moduleRows]);

  const fitObj =
    fitPayload && typeof fitPayload === "object" && !Array.isArray(fitPayload)
      ? (unwrap(fitPayload) as Record<string, unknown>)
      : null;
  const fitSummary =
    fitObj && typeof fitObj === "object"
      ? {
          score:
            (typeof fitObj.fit_score === "number" ? fitObj.fit_score : null) ??
            (typeof fitObj.score === "number" ? fitObj.score : null) ??
            (typeof fitObj.readiness_score === "number" ? fitObj.readiness_score : null),
          eligible: typeof fitObj.eligible === "boolean" ? fitObj.eligible : null,
          status: typeof fitObj.status === "string" ? fitObj.status : null,
          headline: typeof fitObj.summary === "string" ? fitObj.summary : null,
        }
      : null;

  return (
    <section className="rounded-xl border border-violet-500/30 dark:border-violet-800/50 bg-violet-50/30 dark:bg-slate-900/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-violet-500/5 dark:hover:bg-slate-800/40 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-violet-500 dark:text-violet-400 shrink-0" />
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Google Ads Intelligence</h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Module progress (M01–M15), evaluate-fit, readiness — live API
            </p>
          </div>
        </div>
        {open ? (
          <ChevronDown className="w-5 h-5 text-slate-500 shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-500 shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-4 border-t border-violet-200/50 dark:border-slate-700/50 pt-4">
          <p className="text-xs text-slate-500 font-mono">X-Tenant-ID: {effectiveTenant}</p>
          {loading && (
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading intelligence…
            </div>
          )}
          {err && <p className="text-sm text-rose-500">{err}</p>}
          {!loading && (
            <>
              <div
                className="rounded-lg border border-slate-700/50 p-3"
                style={{ backgroundColor: "rgba(15,20,40,0.75)" }}
              >
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Quick readiness</p>
                <div className="flex flex-wrap items-baseline gap-3">
                  {readiness.pct != null && (
                    <span className="text-2xl font-bold text-slate-100">{readiness.pct}%</span>
                  )}
                  <span className="text-sm text-slate-400">{readiness.label}</span>
                </div>
                {fitSummary && (fitSummary.score != null || fitSummary.status || fitSummary.headline) && (
                  <div className="mt-3 pt-3 border-t border-slate-700/40 text-sm text-slate-300 space-y-1">
                    {fitSummary.score != null && (
                      <p>
                        Evaluate-fit score:{" "}
                        <strong className="text-violet-300">{fitSummary.score}</strong>
                      </p>
                    )}
                    {fitSummary.eligible != null && (
                      <p>
                        Eligible:{" "}
                        <strong className={fitSummary.eligible ? "text-emerald-400" : "text-amber-400"}>
                          {fitSummary.eligible ? "yes" : "no"}
                        </strong>
                      </p>
                    )}
                    {fitSummary.status && <p className="text-slate-400">Status: {fitSummary.status}</p>}
                    {fitSummary.headline && <p className="text-slate-400">{fitSummary.headline}</p>}
                  </div>
                )}
              </div>

              {moduleRows.length > 0 && (
                <div>
                  <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                    Modules (live)
                  </h3>
                  <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 max-h-64 overflow-y-auto pr-1">
                    {moduleRows.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-2 rounded-lg border border-slate-700/40 px-2 py-1.5 text-xs"
                        style={{ backgroundColor: "rgba(15,20,40,0.6)" }}
                      >
                        <span className="font-mono text-slate-200 shrink-0">{m.id.toUpperCase()}</span>
                        <span
                          className={`px-2 py-0.5 rounded-full border text-[10px] font-medium capitalize ${statusPillClass(m.status)}`}
                        >
                          {m.status.replace(/_/g, " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Raw: modules/status
                </h3>
                <pre className="text-xs bg-slate-900/80 text-slate-300 p-3 rounded-lg overflow-auto max-h-40 border border-slate-700/50">
                  {JSON.stringify(modulesPayload, null, 2)}
                </pre>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Raw: evaluate-fit
                </h3>
                <pre className="text-xs bg-slate-900/80 text-slate-300 p-3 rounded-lg overflow-auto max-h-40 border border-slate-700/50">
                  {JSON.stringify(fitPayload, null, 2)}
                </pre>
              </div>
            </>
          )}
          <button
            type="button"
            onClick={() => void load()}
            disabled={loading}
            className="text-sm px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50"
          >
            Refresh data
          </button>
        </div>
      )}
    </section>
  );
}
