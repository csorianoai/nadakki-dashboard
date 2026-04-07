"use client";

import {
  getApplication,
  getApplicationEvents,
  loadProcessResultFromSession,
  processApplication,
  saveProcessResultToSession,
  type ApplicationMode,
  type AiDecisionShape,
  type BankDecisionShape,
  type BankLegWrapper,
  type CreditApplicationResponse,
  type CreditEventRow,
  type CreditProcessResult,
  CREDICEFI_PILOT_TENANT_ID,
} from "@/app/hooks/useCredit";
import { useTenant } from "@/contexts/TenantContext";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

function DecisionBadge({ label }: { label: string }) {
  const u = label.toUpperCase();
  const map: Record<string, { text: string; classes: string }> = {
    APPROVE: {
      text: "Approved",
      classes:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-800",
    },
    APPROVED: {
      text: "Approved",
      classes:
        "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/40 dark:text-green-200 dark:border-green-800",
    },
    DECLINE: {
      text: "Declined",
      classes:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800",
    },
    DECLINED: {
      text: "Declined",
      classes:
        "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800",
    },
    REVIEW: {
      text: "Under review",
      classes:
        "bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/40 dark:text-amber-200 dark:border-amber-800",
    },
    PENDING: {
      text: "Pending",
      classes:
        "bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
    },
    CONDITIONAL: {
      text: "Conditional",
      classes:
        "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800",
    },
  };
  const config = map[u] ?? {
    text: label || "\u2014",
    classes:
      "bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
  };
  return (
    <span
      className={`inline-block rounded-full border px-4 py-1 text-sm font-semibold ${config.classes}`}
    >
      {config.text}
    </span>
  );
}

function reasonEntry(rc: { code: string } | string): string {
  return typeof rc === "string" ? rc : rc.code;
}

function EventTimeline({ events }: { events: CreditEventRow[] }) {
  if (!events.length) {
    return (
      <p className="text-gray-400 dark:text-gray-500 text-sm py-4">
        No events recorded yet.
      </p>
    );
  }
  return (
    <ol className="space-y-3">
      {events.map((ev, i) => {
        const actor =
          (ev.payload?.note as string | undefined) ||
          (typeof ev.payload?.stage === "string" ? ev.payload.stage : null) ||
          "credit_core";
        return (
          <li key={ev.event_id ?? `${ev.emitted_at}-${i}`} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div className="w-2 h-2 rounded-full bg-gray-900 dark:bg-gray-100 mt-1.5 shrink-0" />
              {i < events.length - 1 && (
                <div className="w-px flex-1 bg-gray-200 dark:bg-gray-700 mt-1 min-h-[1rem]" />
              )}
            </div>
            <div className="pb-3 min-w-0 flex-1">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {ev.event_type.replace(/_/g, " ")}
              </p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                {new Date(ev.emitted_at).toLocaleString()} · {actor}
              </p>
              {ev.payload && Object.keys(ev.payload).length > 0 && (
                <pre className="mt-1 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded p-2 overflow-x-auto max-h-40">
                  {JSON.stringify(ev.payload, null, 2)}
                </pre>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function resolveModeFromPayload(
  app: CreditApplicationResponse
): ApplicationMode {
  const m = app.application_payload?.mode;
  if (m === "AI_ONLY" || m === "BANK_ONLY" || m === "HYBRID") return m;
  return "AI_ONLY";
}

function pickDecisionLabel(
  ai: AiDecisionShape | undefined,
  bank: BankDecisionShape | undefined,
  state: string
): string {
  const a = ai?.recommendation || ai?.decision;
  if (a) return a;
  const b = bank?.decision;
  if (b) return b;
  return state;
}

export default function ApplicationDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { tenantId: contextTenant } = useTenant();
  const tenantResolved =
    (contextTenant && contextTenant.trim()) || CREDICEFI_PILOT_TENANT_ID;

  const [app, setApp] = useState<CreditApplicationResponse | null>(null);
  const [cachedResult, setCachedResult] = useState<CreditProcessResult | null>(
    null
  );
  const [events, setEvents] = useState<CreditEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reprocessing, setReprocessing] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const [appData, eventsData] = await Promise.all([
        getApplication(tenantResolved, id),
        getApplicationEvents(tenantResolved, id),
      ]);
      setApp(appData);
      setEvents(eventsData.events);
      const cached = loadProcessResultFromSession(id);
      setCachedResult(cached);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
      setApp(null);
    } finally {
      setLoading(false);
    }
  }, [id, tenantResolved]);

  useEffect(() => {
    void load();
  }, [load]);

  async function reprocess() {
    if (!app || !id) return;
    setReprocessing(true);
    setError(null);
    try {
      const mode = resolveModeFromPayload(app);
      const res = await processApplication(tenantResolved, id, mode, true);
      setCachedResult(res);
      saveProcessResultToSession(id, res);
      const ev = await getApplicationEvents(tenantResolved, id);
      setEvents(ev.events);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Processing failed");
    } finally {
      setReprocessing(false);
    }
  }

  if (!id) {
    return (
      <div className="p-8 text-center text-sm text-gray-500">
        Missing application id.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">
        Loading application…
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="p-8 max-w-lg mx-auto text-center">
        <p className="text-red-500 dark:text-red-400 mb-4">{error ?? "Not found"}</p>
        <Link
          href="/credit"
          className="text-sm text-blue-600 dark:text-blue-400 underline"
        >
          ← Back to Credit
        </Link>
      </div>
    );
  }

  const result = cachedResult;
  const aiDecision: AiDecisionShape | undefined =
    result?.ai_decision ??
    result?.ai ??
    result?.hybrid?.ai ??
    undefined;
  const bankWrap: BankLegWrapper | null =
    result?.bank ?? result?.hybrid?.bank ?? null;
  const bankDecision = bankWrap?.bank_decision;

  const payloadMode =
    typeof app.application_payload.mode === "string"
      ? app.application_payload.mode.replace(/_/g, " ")
      : "\u2014";

  const summaryLabel = pickDecisionLabel(
    aiDecision,
    bankDecision,
    app.state
  );

  const showDecisionHint =
    app.state !== "DRAFT" && !result && !aiDecision && !bankDecision;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <Link
            href="/credit"
            className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 mb-1 block"
          >
            ← Credit Core
          </Link>
          <h1 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Application
          </h1>
          <p className="text-xs text-gray-400 mt-0.5 font-mono break-all">
            {id}
          </p>
        </div>
        <DecisionBadge label={summaryLabel} />
      </div>

      <div className="flex flex-wrap gap-4 text-sm">
        {[
          { label: "Mode", value: payloadMode },
          { label: "State", value: app.state.replace(/_/g, " ") },
          { label: "Events", value: String(events.length) },
          {
            label: "Dry run",
            value: app.application_payload.dry_run !== false ? "Yes" : "No",
          },
          ...(bankWrap?.adapter_operation_mode
            ? [
                {
                  label: "Bank adapter",
                  value: String(bankWrap.adapter_operation_mode),
                },
              ]
            : []),
        ].map(({ label, value }) => (
          <div
            key={label}
            className="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 px-3 py-2"
          >
            <p className="text-xs text-gray-400 dark:text-gray-500">
              {label}
            </p>
            <p className="font-medium text-gray-800 dark:text-gray-100 text-sm">
              {value}
            </p>
          </div>
        ))}
      </div>

      {showDecisionHint && (
        <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-900 dark:text-amber-100">
          Decisions are returned by <code className="text-xs">POST /process</code>{" "}
          and kept in this browser session. Submit from{" "}
          <Link href="/credit/new" className="underline font-medium">
            New Application
          </Link>{" "}
          or use <strong>Process</strong> below to refresh.
        </div>
      )}

      {aiDecision && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              AI underwriting
            </h2>
            <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
              {aiDecision.source_system ?? "NADAKKI"}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {aiDecision.score != null
                  ? Math.round(aiDecision.score)
                  : "\u2014"}
              </p>
              <p className="text-xs text-gray-400">Score (0\u20131000)</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {aiDecision.confidence != null
                  ? `${Math.round(
                      aiDecision.confidence <= 1
                        ? aiDecision.confidence * 100
                        : aiDecision.confidence
                    )}%`
                  : "\u2014"}
              </p>
              <p className="text-xs text-gray-400">Confidence</p>
            </div>
            <div className="text-center flex flex-col items-center justify-center gap-1">
              <DecisionBadge
                label={
                  aiDecision.recommendation ||
                  aiDecision.decision ||
                  "REVIEW"
                }
              />
              <p className="text-xs text-gray-400">Recommendation</p>
            </div>
          </div>
          {aiDecision.reason_codes && aiDecision.reason_codes.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Reason codes
              </p>
              <ul className="space-y-1">
                {aiDecision.reason_codes.map((rc, i) => (
                  <li
                    key={`${reasonEntry(rc)}-${i}`}
                    className="text-xs text-gray-600 dark:text-gray-300 font-mono"
                  >
                    {reasonEntry(rc)}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {bankDecision && (
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              Bank decision
            </h2>
            <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">
              {bankDecision.source_system ?? "bank"}
            </span>
          </div>
          <DecisionBadge label={bankDecision.decision ?? "REVIEW"} />
          {bankDecision.reason_codes && bankDecision.reason_codes.length > 0 && (
            <ul className="mt-3 text-xs text-gray-600 dark:text-gray-300 space-y-1 font-mono">
              {bankDecision.reason_codes.map((c, i) => (
                <li key={`${c}-${i}`}>{c}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {app.state === "DRAFT" && (
        <button
          type="button"
          onClick={() => void reprocess()}
          disabled={reprocessing}
          className="w-full bg-gray-900 dark:bg-gray-100 dark:text-gray-900 text-white text-sm font-medium py-2.5 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 disabled:opacity-50 transition-colors"
        >
          {reprocessing ? "Processing…" : "Process application"}
        </button>
      )}

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 p-5">
        <h2 className="font-semibold text-sm text-gray-900 dark:text-gray-100 mb-4">
          Event timeline
          {events.length > 0 && (
            <span className="ml-2 text-xs text-gray-400 font-normal">
              {events.length} events
            </span>
          )}
        </h2>
        <EventTimeline events={events} />
      </div>
    </div>
  );
}
