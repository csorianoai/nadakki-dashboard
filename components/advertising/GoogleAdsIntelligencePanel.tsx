"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ChevronDown, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { apiFetch } from "@/lib/api/fetch-client";

function unwrap(json: unknown): unknown {
  if (!json || typeof json !== "object") return json;
  const o = json as Record<string, unknown>;
  if (o.data !== undefined) return o.data;
  return json;
}

type ModuleRow = { id: string; title: string; status: string; reason: string | null; deps: string[] };

function normalizeModuleItem(x: unknown): ModuleRow {
  if (x && typeof x === "object") {
    const r = x as Record<string, unknown>;
    const id = String(r.id ?? r.module_id ?? r.code ?? "?").toLowerCase();
    const title = String(r.title ?? r.name ?? r.label ?? id.toUpperCase());
    const status = String(r.status ?? r.state ?? "unknown");
    const rs = r.blocked_reason ?? r.reason;
    const reason = typeof rs === "string" && rs.trim() ? rs.trim() : null;
    const deps = Array.isArray(r.dependencies) ? r.dependencies.map((d) => String(d).toLowerCase()) : [];
    return { id, title, status, reason, deps };
  }
  return { id: "?", title: "", status: "unknown", reason: null, deps: [] };
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
  if (!rows.length) return { pct: null as number | null, label: "Sin datos de módulos" };
  const completed = rows.filter((r) => r.status.toLowerCase() === "completed").length;
  const ready = rows.filter((r) => r.status.toLowerCase() === "ready").length;
  const blocked = rows.filter((r) => r.status.toLowerCase() === "blocked").length;
  const pct = Math.round(((completed * 2 + ready) / (rows.length * 2)) * 100);
  return {
    pct,
    label: `${completed} completados · ${ready} listos · ${blocked} bloqueados · ${rows.length} módulos`,
  };
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function statusText(s: string) {
  const v = s.toLowerCase();
  if (v === "completed") return "Completado";
  if (v === "ready") return "Listo";
  if (v === "blocked") return "Bloqueado";
  if (v === "in_progress" || v === "running") return "En curso";
  if (v === "not_ready") return "No listo";
  return s.replace(/_/g, " ");
}

function blockedText(m: ModuleRow, rows: ModuleRow[]) {
  const names = m.deps
    .filter((d) => rows.find((r) => r.id === d && r.status.toLowerCase() !== "completed"))
    .map((d) => rows.find((r) => r.id === d)!.title);
  const parts: string[] = [];
  if (names.length) parts.push(`Requiere completar: ${names.join(", ")}`);
  if (m.reason) parts.push(m.reason);
  return parts.length ? parts.join(" · ") : "Motivo no informado";
}

function trackingSentence(rows: ModuleRow[], fit: Record<string, unknown> | null): string | null {
  const flag = fit && typeof fit.tracking_ready === "boolean" ? fit.tracking_ready : null;
  const m13 = rows.find((r) => r.id === "m13" || /conversion tracking/i.test(r.title));
  const ok = flag ?? (m13 ? ["completed", "ready"].includes(m13.status.toLowerCase()) : null);
  if (ok === null) return null;
  return ok
    ? "Medición de conversiones: activa. Podemos leer tus conversiones de Google Analytics y Google Ads."
    : "Medición de conversiones: pendiente. Aún no podemos medir tus conversiones; completa Conversion Tracking.";
}

export default function GoogleAdsIntelligencePanel() {
  const { tenantId } = useTenant();
  const { tenantName } = useAuth();
  const sessionTenant = tenantId?.trim() || "";
  const name = tenantName?.trim();
  const tenantShown = name && name !== "—" && !UUID_RE.test(name) ? name : sessionTenant.slice(0, 8);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [modulesPayload, setModulesPayload] = useState<unknown>(null);
  const [fitPayload, setFitPayload] = useState<unknown>(null);
  const [modErr, setModErr] = useState(false);
  const [fitErr, setFitErr] = useState(false);

  const load = useCallback(async () => {
    if (!sessionTenant) return;
    setLoading(true);
    const headers = { Accept: "application/json", "X-Tenant-ID": sessionTenant };
    const call = async (url: string, init: RequestInit): Promise<{ ok: boolean; data: unknown }> => {
      try {
        const res = await apiFetch(url, { cache: "no-store", headers, ...init });
        if (!res.ok) return { ok: false, data: null };
        return { ok: true, data: await res.json() };
      } catch {
        return { ok: false, data: null };
      }
    };
    const [mod, fit] = await Promise.all([
      call("/api/v1/google-ads/modules/status", {}),
      call("/api/v1/google-ads/fundamentals/evaluate-fit", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: sessionTenant }),
      }),
    ]);
    setModulesPayload(mod.data);
    setModErr(!mod.ok);
    setFitPayload(fit.data);
    setFitErr(!fit.ok);
    setLoading(false);
  }, [sessionTenant]);

  useEffect(() => {
    if (open && sessionTenant) void load();
  }, [open, sessionTenant, load]);

  const moduleRows = useMemo(() => extractModules(modulesPayload), [modulesPayload]);
  const readiness = useMemo(() => readinessFromModules(moduleRows), [moduleRows]);

  const fitObj =
    fitPayload && typeof fitPayload === "object" && !Array.isArray(fitPayload)
      ? (unwrap(fitPayload) as Record<string, unknown>)
      : null;
  const tracking = trackingSentence(moduleRows, fitObj);
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
              Progreso de módulos, aptitud y medición de conversiones
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
          {!sessionTenant ? (
            <p className="text-sm text-slate-400">Inicia sesión para ver el estado</p>
          ) : (
            <>
              <p className="text-xs text-slate-500">Tenant: {tenantShown}</p>
              {loading && (
                <div className="flex items-center gap-2 text-slate-500 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" /> Cargando…
                </div>
              )}
              {!loading && (
                <>
                  {tracking && (
                    <p className="text-sm text-slate-200 rounded-lg border border-violet-500/30 p-3" data-testid="tracking-status">
                      {tracking}
                    </p>
                  )}
                  <div className="rounded-lg border border-slate-700/50 p-3" style={{ backgroundColor: "rgba(15,20,40,0.75)" }}>
                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Estado de módulos</p>
                    {modErr ? (
                      <p className="text-sm text-amber-400">No pudimos cargar esta parte</p>
                    ) : (
                      <div className="flex flex-wrap items-baseline gap-3">
                        {readiness.pct != null && <span className="text-2xl font-bold text-slate-100">{readiness.pct}%</span>}
                        <span className="text-sm text-slate-400">{readiness.label}</span>
                      </div>
                    )}
                    {!fitErr && fitSummary && (fitSummary.score != null || fitSummary.status || fitSummary.headline) && (
                      <div className="mt-3 pt-3 border-t border-slate-700/40 text-sm text-slate-300 space-y-1">
                        {fitSummary.score != null && (
                          <p>Puntaje de aptitud: <strong className="text-violet-300">{fitSummary.score}</strong></p>
                        )}
                        {fitSummary.eligible != null && (
                          <p>
                            Elegible:{" "}
                            <strong className={fitSummary.eligible ? "text-emerald-400" : "text-amber-400"}>
                              {fitSummary.eligible ? "sí" : "no"}
                            </strong>
                          </p>
                        )}
                        {fitSummary.headline && <p className="text-slate-400">{fitSummary.headline}</p>}
                      </div>
                    )}
                    {fitErr && <p className="mt-3 text-sm text-amber-400">No pudimos cargar esta parte</p>}
                  </div>

                  {!modErr && moduleRows.length > 0 && (
                    <ul className="grid gap-2 sm:grid-cols-2 max-h-80 overflow-y-auto pr-1">
                      {moduleRows.map((m) => (
                        <li
                          key={m.id}
                          className="rounded-lg border border-slate-700/40 px-2 py-1.5 text-xs"
                          style={{ backgroundColor: "rgba(15,20,40,0.6)" }}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-slate-200">{m.title}</span>
                            <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${statusPillClass(m.status)}`}>
                              {statusText(m.status)}
                            </span>
                          </div>
                          {m.status.toLowerCase() === "blocked" && (
                            <p className="mt-1 text-slate-400">{blockedText(m, moduleRows)}</p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              )}
              <button
                type="button"
                onClick={() => void load()}
                disabled={loading}
                className="text-sm px-3 py-1.5 rounded-lg bg-violet-600 text-white hover:bg-violet-500 disabled:opacity-50"
              >
                Actualizar
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
