"use client";

import { useState } from "react";
import {
  Globe,
  Search,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  ExternalLink,
  ChevronRight,
} from "lucide-react";
import { useTenant } from "@/contexts/TenantContext";

const FALLBACK_TENANT = "sf-rentals-nadaki-excursions";

type ReadinessStatusKey = "ready" | "needs_improvement" | "blocked";

function unwrapReport(json: unknown): Record<string, unknown> | null {
  if (!json || typeof json !== "object") return null;
  const o = json as Record<string, unknown>;
  if (o.data && typeof o.data === "object" && !Array.isArray(o.data)) {
    return o.data as Record<string, unknown>;
  }
  return o;
}

export default function LandingReadinessPage() {
  const { tenantId } = useTenant();
  const effectiveTenant = tenantId?.trim() || FALLBACK_TENANT;

  const [domain, setDomain] = useState("nadakiexcursions.com");
  const [keyword, setKeyword] = useState("romantic boat miami");
  const [service, setService] = useState("boat excursion");
  const [location, setLocation] = useState("Miami FL");
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState("");

  async function runAnalysis() {
    setLoading(true);
    setError("");
    setReport(null);
    try {
      const res = await fetch("/api/v1/landing-readiness/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": effectiveTenant,
        },
        body: JSON.stringify({
          domain,
          tenant_id: effectiveTenant,
          keyword,
          target_service: service,
          target_location: location,
          max_pages: 8,
          use_cache: false,
        }),
      });
      if (!res.ok) throw new Error(`${res.status}`);
      const raw = await res.json();
      const data = unwrapReport(raw);
      if (!data) throw new Error("Invalid response");
      setReport(data);
    } catch (e: unknown) {
      setError("Analysis failed: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setLoading(false);
    }
  }

  const statusColor: Record<ReadinessStatusKey, string> = {
    ready: "text-emerald-400",
    needs_improvement: "text-amber-400",
    blocked: "text-rose-400",
  };

  const readinessKey = (report?.readiness_status as string | undefined)?.replace("-", "_") as ReadinessStatusKey | undefined;
  const statusClass =
    readinessKey && readinessKey in statusColor ? statusColor[readinessKey] : "text-slate-400";

  const gaps = Array.isArray(report?.gaps) ? (report!.gaps as string[]) : [];
  const recommendations = Array.isArray(report?.recommendations) ? (report!.recommendations as string[]) : [];
  const pages = Array.isArray(report?.pages) ? (report!.pages as Record<string, unknown>[]) : [];
  const outline =
    report?.generated_copy_outline && typeof report.generated_copy_outline === "object"
      ? (report.generated_copy_outline as Record<string, unknown>)
      : null;
  const trustBar = Array.isArray(outline?.trust_bar) ? (outline.trust_bar as string[]) : [];

  return (
    <div className="min-h-screen p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-100 flex items-center gap-2">
          <Globe size={20} className="text-indigo-400" />
          Landing Page Readiness
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Real site crawl · Message match scoring · Copy outline generation
        </p>
        <p className="text-xs text-slate-600 mt-1 font-mono">Tenant: {effectiveTenant}</p>
      </div>

      <div
        className="rounded-xl border border-slate-700/40 p-5 space-y-4"
        style={{ backgroundColor: "rgba(15,20,40,0.8)" }}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Domain</label>
            <input
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              placeholder="example.com"
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Target Keyword</label>
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="romantic boat miami"
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Target Service</label>
            <input
              value={service}
              onChange={(e) => setService(e.target.value)}
              placeholder="boat excursion"
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Target Location</label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Miami FL"
              className="w-full bg-slate-800/50 border border-slate-700/50 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>
        <button
          type="button"
          onClick={() => void runAnalysis()}
          disabled={loading}
          className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 size={14} className="animate-spin" /> Analyzing...
            </>
          ) : (
            <>
              <Search size={14} /> Analyze Site
            </>
          )}
        </button>
        {error && (
          <p className="text-sm text-rose-400 flex items-center gap-1">
            <AlertTriangle size={14} /> {error}
          </p>
        )}
      </div>

      {report && (
        <div className="space-y-4">
          <div
            className="rounded-xl border border-slate-700/40 p-5"
            style={{ backgroundColor: "rgba(15,20,40,0.8)" }}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Overall Status</p>
                <p className={`text-2xl font-bold capitalize ${statusClass}`}>
                  {String(report.readiness_status ?? "—").replace(/_/g, " ")}
                </p>
                <p className="text-xs text-slate-500 mt-1">{String(report.summary ?? "")}</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-slate-100">
                  {report.overall_score != null ? String(report.overall_score) : "—"}
                  <span className="text-slate-500 text-lg font-normal">/100</span>
                </p>
                <p className="text-xs text-slate-500">readiness score</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-slate-400">
              <span>
                Pages scanned:{" "}
                <strong className="text-slate-200">{String(report.scanned_urls_count ?? "—")}</strong>
              </span>
              <span>
                Duration: <strong className="text-slate-200">{String(report.duration_seconds ?? "—")}s</strong>
              </span>
              <span>
                Cache:{" "}
                <strong className="text-slate-200">
                  {report.cache_hit === true ? "HIT" : report.cache_hit === false ? "MISS" : "—"}
                </strong>
              </span>
              {typeof report.best_page_url === "string" && report.best_page_url && (
                <a
                  href={report.best_page_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                >
                  Best page <ExternalLink size={12} />
                </a>
              )}
            </div>
          </div>

          {gaps.length > 0 && (
            <div
              className="rounded-xl border border-rose-500/20 p-4"
              style={{ backgroundColor: "rgba(15,20,40,0.8)" }}
            >
              <p className="text-xs text-rose-400 uppercase tracking-wider mb-3">Gaps Detected</p>
              <ul className="space-y-2">
                {gaps.map((g, i) => (
                  <li key={i} className="text-sm text-slate-300 flex gap-2">
                    <AlertTriangle size={14} className="text-rose-400 shrink-0 mt-0.5" />
                    {g}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommendations.length > 0 && (
            <div
              className="rounded-xl border border-amber-500/20 p-4"
              style={{ backgroundColor: "rgba(15,20,40,0.8)" }}
            >
              <p className="text-xs text-amber-400 uppercase tracking-wider mb-3">Recommendations</p>
              <ul className="space-y-2">
                {recommendations.map((r, i) => (
                  <li key={i} className="text-sm text-slate-300 flex gap-2">
                    <ChevronRight size={14} className="text-amber-400 shrink-0 mt-0.5" />
                    {r}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {pages.length > 0 && (
            <div
              className="rounded-xl border border-slate-700/40 p-4"
              style={{ backgroundColor: "rgba(15,20,40,0.8)" }}
            >
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Pages Discovered</p>
              <div className="space-y-2">
                {pages.map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-2 border-b border-slate-700/30 last:border-0"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {p.call_to_action_present ? (
                        <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      ) : (
                        <Clock size={14} className="text-slate-500 shrink-0" />
                      )}
                      <div className="min-w-0">
                        <p className="text-sm text-slate-200 truncate">{String(p.path ?? "")}</p>
                        <p className="text-xs text-slate-500 truncate">{String(p.title ?? "")}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-700/50 text-slate-400">
                        {String(p.page_type ?? "—")}
                      </span>
                      {p.keyword_in_h1 ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400">
                          H1 match
                        </span>
                      ) : null}
                      {p.booking_present ? (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
                          booking
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {outline && (
            <div
              className="rounded-xl border border-indigo-500/20 p-4"
              style={{ backgroundColor: "rgba(15,20,40,0.8)" }}
            >
              <p className="text-xs text-indigo-400 uppercase tracking-wider mb-3">Generated Copy Outline</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-slate-500 mb-1">Headline</p>
                  <p className="text-base font-semibold text-slate-100">{String(outline.headline ?? "")}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">Subheadline</p>
                  <p className="text-sm text-slate-300">{String(outline.subheadline ?? "")}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">CTAs</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className="px-3 py-1 text-xs rounded-lg bg-indigo-600 text-white">
                      {String(outline.cta_primary ?? "")}
                    </span>
                    <span className="px-3 py-1 text-xs rounded-lg border border-slate-600 text-slate-300">
                      {String(outline.cta_secondary ?? "")}
                    </span>
                  </div>
                </div>
                {trustBar.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-1">Trust Bar</p>
                    <div className="flex flex-wrap gap-2">
                      {trustBar.map((t, i) => (
                        <span
                          key={i}
                          className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
