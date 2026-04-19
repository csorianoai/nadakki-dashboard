"use client";

import { useState } from "react";
import GoogleAdsClient from "./GoogleAdsClient";
import { AgentCard } from "@/components/ui/AgentCard";
import { useTenant } from "@/contexts/TenantContext";
import { AdvertisingDashboardLive } from "../components/AdvertisingDashboardLive";
import PreflightResultModal from "@/components/preflight/PreflightResultModal";
import {
  postGoogleAdsPreflight,
  preflightFromExecuteErrorBody,
  type GoogleAdsPreflightResult,
} from "@/lib/api/googleAdsPreflight";

interface Agent {
  id: string;
  backendId: string;
  name: string;
  description: string;
  icon: string;
  status: "active" | "inactive" | "pending";
  metrics?: Array<{ label: string; value: number | string }>;
}

const AGENTS: Agent[] = [
  {
    id: "budget-pacing",
    backendId: "google_ads_budget_pacing_agent__googleadsbudgetpacingia",
    name: "Budget Pacing Agent",
    description: "Auditoría de conversiones, diagnóstico PMax y propuestas de puja",
    icon: "💰",
    status: "active",
    metrics: [
      { label: "Presupuesto", value: "$500" },
      { label: "Paced", value: "45%" },
    ],
  },
  {
    id: "strategist",
    backendId: "google_ads_strategist_agent__googleadsstrategistia",
    name: "Strategist Agent",
    description: "Propuestas de campaña Search, PMax, Demand Gen y Shopping",
    icon: "📊",
    status: "active",
    metrics: [
      { label: "Analisis", value: 24 },
      { label: "Efectividad", value: "92%" },
    ],
  },
  {
    id: "rsa-copy-generator",
    backendId: "rsa_ad_copy_generator_agent__rsaadcopygeneratoria",
    name: "RSA Copy Generator",
    description: "Propuestas de creativos y activos",
    icon: "📝",
    status: "active",
    metrics: [
      { label: "Ads", value: 342 },
      { label: "CTR", value: "5.2%" },
    ],
  },
];

const API_BASE = "";

function notReadyTitle(actionKey: string): string {
  if (actionKey === "bid_strategy_change_propose") {
    return "Not ready: conversion tracking must be validated before bid strategy changes.";
  }
  return "Not ready: prerequisites must be satisfied before this action.";
}

type GuardedAction = {
  id: string;
  label: string;
  actionKey: GoogleAdsPreflightResult["action_key"];
  agentId: string;
  payload: Record<string, unknown>;
};

/** Mission actions: canonical keys + agent payloads aligned with backend `infer_action_key`. */
const GUARDED_ACTIONS: GuardedAction[] = [
  {
    id: "search",
    label: "Propose Search campaign",
    actionKey: "propose_search_campaign",
    agentId: "google_ads_strategist_agent__googleadsstrategistia",
    payload: { action: "search_campaign_propose" },
  },
  {
    id: "pmax",
    label: "Propose PMax campaign",
    actionKey: "propose_pmax_campaign",
    agentId: "google_ads_strategist_agent__googleadsstrategistia",
    payload: { action: "pmax_campaign_propose" },
  },
  {
    id: "demandgen",
    label: "Propose Demand Gen campaign",
    actionKey: "propose_demand_gen_campaign",
    agentId: "google_ads_strategist_agent__googleadsstrategistia",
    payload: { action: "demand_gen_campaign_propose" },
  },
  {
    id: "shopping",
    label: "Propose Shopping campaign",
    actionKey: "propose_shopping_campaign",
    agentId: "google_ads_strategist_agent__googleadsstrategistia",
    payload: { action: "shopping_campaign_propose" },
  },
  {
    id: "conv-audit",
    label: "Run conversion tracking audit",
    actionKey: "conversion_tracking_audit",
    agentId: "google_ads_budget_pacing_agent__googleadsbudgetpacingia",
    payload: { action: "conversion_tracking_audit" },
  },
  {
    id: "pmax-diag",
    label: "Run PMax diagnostic",
    actionKey: "pmax_diagnostic",
    agentId: "google_ads_budget_pacing_agent__googleadsbudgetpacingia",
    payload: { action: "pmax_diagnostic" },
  },
  {
    id: "bid-strategy",
    label: "Propose bid strategy change",
    actionKey: "bid_strategy_change_propose",
    agentId: "google_ads_budget_pacing_agent__googleadsbudgetpacingia",
    payload: { action: "bid_strategy_change_propose" },
  },
  {
    id: "assets",
    label: "Propose asset creation",
    actionKey: "propose_asset_creation",
    agentId: "rsa_ad_copy_generator_agent__rsaadcopygeneratoria",
    payload: { action: "rsa_ad_copy_generate" },
  },
];

type ModalState =
  | { open: false }
  | {
      open: true;
      variant: "blocked" | "not_ready" | "proposal_only" | "error" | "execute_ok";
      title: string;
      result?: GoogleAdsPreflightResult;
      bodyLines: string[];
      executePayload?: { agentId: string; payload: Record<string, unknown> };
    };

export default function GoogleAdsPage() {
  const { tenantId } = useTenant();
  const [selectedId, setSelectedId] = useState("budget-pacing");
  const [results, setResults] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState<Record<string, boolean>>({});
  const [modal, setModal] = useState<ModalState>({ open: false });
  const [preflightResult, setPreflightResult] = useState<GoogleAdsPreflightResult | null>(null);
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);
  const selected = AGENTS.find((a) => a.id === selectedId);

  const openModal = (m: Omit<Extract<ModalState, { open: true }>, "open">) => {
    setModal({ open: true, ...m });
  };

  const runExecute = async (agentId: string, payload: Record<string, unknown>, resultKey: string) => {
    if (!tenantId) return;
    setLoading((p) => ({ ...p, [resultKey]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/v1/agents/${encodeURIComponent(agentId)}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Tenant-ID": tenantId },
        body: JSON.stringify({ payload, dry_run: false }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const pf = preflightFromExecuteErrorBody(data);
        if (pf) {
          const title =
            pf.status === "blocked"
              ? "Blocked: this tenant is not eligible for this campaign type."
              : notReadyTitle(pf.action_key);
          openModal({
            variant: pf.status === "blocked" ? "blocked" : "not_ready",
            title,
            result: pf,
            bodyLines: [...pf.reasons, ...(pf.required_fixes?.length ? ["", "Required fixes:", ...pf.required_fixes] : [])],
          });
          return;
        }
        const detail = data?.detail;
        const msg =
          typeof detail === "string"
            ? detail
            : typeof detail === "object" && detail && "message" in detail
              ? String((detail as { message: unknown }).message)
              : `HTTP ${res.status}`;
        openModal({
          variant: "error",
          title: "Error",
          bodyLines: [msg],
        });
        return;
      }
      setResults((prev) => ({ ...prev, [resultKey]: data }));
      const forced = Boolean(
        data.google_ads_preflight && typeof data.google_ads_preflight === "object"
          ? (data.google_ads_preflight as { forced_dry_run?: boolean }).forced_dry_run
          : false
      );
      openModal({
        variant: "execute_ok",
        title: forced ? "Proposal only: this action requires approval before execution." : "Ejecución completada",
        bodyLines: forced
          ? [
              String(
                (data.google_ads_preflight as { preflight_notice?: string })?.preflight_notice ??
                  "Proposal only: this action requires approval before execution."
              ),
              `dry_run efectivo: ${String(data.dry_run)}`,
            ]
          : ["La acción se ejecutó según la política del backend."],
        executePayload: undefined,
      });
    } finally {
      setLoading((p) => ({ ...p, [resultKey]: false }));
    }
  };

  const runGuardedAction = async (def: GuardedAction) => {
    if (!tenantId) {
      openModal({
        variant: "error",
        title: "Tenant",
        bodyLines: ["Selecciona un tenant para continuar."],
      });
      return;
    }
    setLoading((p) => ({ ...p, [def.id]: true }));
    try {
      const pfRes = await postGoogleAdsPreflight(tenantId, def.actionKey, def.payload);
      if (pfRes.ok === false) {
        openModal({
          variant: "error",
          title: "Pre-flight no disponible",
          bodyLines: [pfRes.error],
        });
        return;
      }
      const pf = pfRes.data;
      setPreflightResult(pf);
      if (pf.status === "blocked" || pf.status === "not_ready") {
        setPendingAction(null);
        return;
      }
      if (pf.status === "proposal_only" || pf.status === "allowed") {
        setPendingAction(() => () => {
          void runExecute(def.agentId, def.payload, def.id);
        });
        return;
      }
      setPreflightResult(null);
      setPendingAction(null);
      openModal({
        variant: "error",
        title: "Pre-flight",
        bodyLines: [`Unexpected status: ${String(pf.status)}`],
      });
    } finally {
      setLoading((p) => ({ ...p, [def.id]: false }));
    }
  };

  const executeAgent = async (agent: Agent) => {
    if (!tenantId) return;
    setLoading((prev) => ({ ...prev, [agent.id]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/v1/agents/${encodeURIComponent(agent.backendId)}/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Tenant-ID": tenantId },
        body: JSON.stringify({ payload: {}, dry_run: true }),
      });
      const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
      if (!res.ok) {
        const pf = preflightFromExecuteErrorBody(data);
        if (pf) {
          openModal({
            variant: pf.status === "blocked" ? "blocked" : "not_ready",
            title:
              pf.status === "blocked"
                ? "Blocked: this tenant is not eligible for this campaign type."
                : "Not ready",
            result: pf,
            bodyLines: pf.reasons,
          });
          return;
        }
        const err = data?.detail;
        throw new Error(typeof err === "string" ? err : `HTTP ${res.status}`);
      }
      setResults((prev) => ({ ...prev, [agent.id]: { success: true, data } }));
    } catch (err: unknown) {
      setResults((prev) => ({
        ...prev,
        [agent.id]: { success: false, error: err instanceof Error ? err.message : String(err) },
      }));
    } finally {
      setLoading((prev) => ({ ...prev, [agent.id]: false }));
    }
  };

  return (
    <div className="space-y-8 p-6 max-w-7xl mx-auto">
      <GoogleAdsClient embed navigationBackHref="/advertising" />
      <AdvertisingDashboardLive title="Google Ads — Dashboard API" />
      <div>
        <h1 className="text-4xl font-bold mb-2">💰 Google Ads Hub</h1>
        <p className="text-gray-600">Agentes especializados de automatizacion - Conectados al Backend</p>
      </div>

      <section className="rounded-xl border border-sky-200 dark:border-sky-800 bg-sky-50/50 dark:bg-slate-900/40 p-4">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">Acciones con pre-flight automático</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Antes de ejecutar, se evalúa preparación del tenant y reglas por acción. Bloqueos y “not ready” no ejecutan;
          las propuestas pueden forzar dry_run hasta aprobación.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {GUARDED_ACTIONS.map((a) => (
            <button
              key={a.id}
              type="button"
              disabled={Boolean(loading[a.id]) || !tenantId}
              onClick={() => void runGuardedAction(a)}
              className="text-left rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-2 text-sm font-medium text-slate-800 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
            >
              {loading[a.id] ? "…" : a.label}
            </button>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {AGENTS.map((agent) => (
          <AgentCard
            key={agent.id}
            {...agent}
            isSelected={selectedId === agent.id}
            onSelect={() => setSelectedId(agent.id)}
            onExecute={() => executeAgent(agent)}
          />
        ))}
      </div>
      {selected && (
        <div className="border-2 border-blue-500 rounded-xl p-8 bg-gradient-to-r from-blue-50 to-white dark:from-slate-900 dark:to-slate-800">
          <div className="flex items-center gap-4 mb-6">
            <span className="text-5xl">{selected.icon}</span>
            <div>
              <h3 className="text-2xl font-bold">{selected.name}</h3>
              <p className="text-gray-700 dark:text-gray-300">{selected.description}</p>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
            {selected.metrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {selected.metrics.map((m, i) => (
                  <div key={i} className="text-center p-3 bg-gray-50 dark:bg-slate-800 rounded">
                    <div className="font-bold text-2xl text-blue-600 dark:text-blue-400">{m.value}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{m.label}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex gap-3 flex-wrap">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded font-semibold disabled:opacity-50"
                type="button"
                disabled={loading[selected.id]}
                onClick={() => executeAgent(selected)}
              >
                {loading[selected.id] ? "Ejecutando..." : "Ejecutar (dry run)"}
              </button>
              <button className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-800 dark:text-gray-100 py-2 px-4 rounded font-semibold" type="button">
                Historico
              </button>
              <button className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded font-semibold" type="button">
                Programar
              </button>
            </div>
            {results[selected.id] && (
              <div
                className={`mt-4 p-4 rounded ${
                  (results[selected.id] as { success?: boolean })?.success
                    ? "bg-green-50 border border-green-200 dark:bg-green-950/40 dark:border-green-800"
                    : "bg-red-50 border border-red-200 dark:bg-red-950/40 dark:border-red-800"
                }`}
              >
                <p
                  className={`font-semibold ${
                    (results[selected.id] as { success?: boolean })?.success
                      ? "text-green-700 dark:text-green-300"
                      : "text-red-700 dark:text-red-300"
                  }`}
                >
                  {(results[selected.id] as { success?: boolean })?.success ? "Exito - DRY RUN" : "Error"}
                </p>
                <pre className="text-xs mt-2 overflow-auto max-h-40">
                  {JSON.stringify(
                    (results[selected.id] as { data?: unknown; error?: unknown })?.data ??
                      (results[selected.id] as { error?: unknown })?.error,
                    null,
                    2
                  )}
                </pre>
              </div>
            )}
          </div>
        </div>
      )}

      <PreflightResultModal
        result={preflightResult}
        onClose={() => {
          setPreflightResult(null);
          setPendingAction(null);
        }}
        onContinue={() => {
          const fn = pendingAction;
          setPreflightResult(null);
          setPendingAction(null);
          fn?.();
        }}
      />

      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" role="dialog" aria-modal="true">
          <div className="max-w-lg w-full rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-600 shadow-xl p-6">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{modal.title}</h3>
            <ul className="text-sm text-slate-700 dark:text-slate-300 space-y-1 list-disc list-inside mb-4">
              {modal.bodyLines.map((line, i) => (
                <li key={i} className={line === "" ? "list-none h-2" : ""}>
                  {line || "\u00A0"}
                </li>
              ))}
            </ul>
            <div className="flex justify-end gap-2 flex-wrap">
              {modal.variant === "proposal_only" && modal.executePayload && (
                <button
                  type="button"
                  className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700"
                  onClick={() => {
                    const ep = modal.executePayload;
                    setModal({ open: false });
                    if (ep) void runExecute(ep.agentId, ep.payload, "proposal-confirm");
                  }}
                >
                  Continuar ejecución
                </button>
              )}
              <button
                type="button"
                className="px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-100"
                onClick={() => setModal({ open: false })}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
