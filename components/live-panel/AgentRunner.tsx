"use client";

import { useState } from "react";

export interface AgentOption {
  id: string;
  name?: string;
  execute_endpoint?: string | null;
}

interface AgentRunnerProps {
  tenantId: string;
  onTenantChange: (v: string) => void;
  tenants?: Array<{ id?: string; slug: string; name?: string; display_name?: string }>;
  tenantErr?: string | null;
  agents: AgentOption[];
  loadingAgents: boolean;
  selectedAgentId: string;
  onAgentChange: (v: string) => void;
  inputPayload: string;
  onInputChange: (v: string) => void;
  dryRun: boolean;
  onDryRunChange: (v: boolean) => void;
  onExecute: () => void;
  onCancel: () => void;
  executing: boolean;
  runId: string | null;
  status: string | null;
}

export function AgentRunner({
  tenantId,
  onTenantChange,
  tenants = [],
  tenantErr,
  agents,
  loadingAgents,
  selectedAgentId,
  onAgentChange,
  inputPayload,
  onInputChange,
  dryRun,
  onDryRunChange,
  onExecute,
  onCancel,
  executing,
  runId,
  status,
}: AgentRunnerProps) {
  const jsonInvalid = ((): boolean => {
    if (!inputPayload.trim()) return false;
    try {
      JSON.parse(inputPayload);
      return false;
    } catch {
      return true;
    }
  })();

  const handleExecute = () => {
    if (jsonInvalid) return;
    onExecute();
  };

  return (
    <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-4">
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-3">Run Agent</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-slate-400 mb-1">Tenant</label>
          {tenants.length > 0 ? (
            <select
              value={tenantId}
              onChange={(e) => onTenantChange(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none"
            >
              {tenants.map((t) => (
                <option key={t.slug} value={t.slug}>
                  {(t.display_name || t.name || t.slug) + ` (${t.slug})`}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={tenantId}
              onChange={(e) => onTenantChange(e.target.value)}
              className="w-full rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              placeholder="tenant slug (ej: sfrentals)"
            />
          )}
          {tenantErr ? (
            <div className="mt-1 text-xs text-red-400 whitespace-pre-wrap">
              {tenantErr}
            </div>
          ) : null}
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Agent</label>
          <select
            value={selectedAgentId}
            onChange={(e) => onAgentChange(e.target.value)}
            disabled={loadingAgents}
            className="w-full rounded-lg border border-slate-600 bg-slate-800/80 px-3 py-2 text-sm text-slate-200 focus:border-cyan-500 focus:outline-none disabled:opacity-50"
          >
            <option value="">Select agent...</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name ?? a.id}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-slate-400 mb-1">Input (JSON)</label>
          <textarea
            value={inputPayload}
            onChange={(e) => onInputChange(e.target.value)}
            rows={4}
            className={`w-full rounded-lg border bg-slate-800/80 px-3 py-2 text-sm text-slate-200 font-mono placeholder-slate-500 focus:outline-none ${
              jsonInvalid ? "border-red-500" : "border-slate-600 focus:border-cyan-500"
            }`}
            placeholder='{"query": "test"}'
          />
          {jsonInvalid && <p className="text-xs text-red-400 mt-1">Invalid JSON</p>}
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={dryRun}
            onChange={(e) => onDryRunChange(e.target.checked)}
            className="rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500"
          />
          <span className="text-sm text-slate-300">Dry run</span>
        </label>

        <div className="flex gap-2 pt-1">
          <button
            onClick={handleExecute}
            disabled={executing || !tenantId || !selectedAgentId || jsonInvalid}
            className="flex-1 rounded-lg bg-cyan-600 px-4 py-2 text-sm font-semibold text-white hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {executing ? "Running…" : "Execute"}
          </button>
          {executing && runId && (
            <button
              onClick={onCancel}
              className="rounded-lg border border-red-500/50 bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/30"
            >
              Cancel
            </button>
          )}
        </div>

        {runId && (
          <div className="rounded-lg bg-slate-800/60 px-3 py-2">
            <p className="text-xs text-slate-400">Run ID</p>
            <p className="text-xs font-mono text-cyan-300 truncate">{runId}</p>
            {status && (
              <p className="text-xs text-slate-300 mt-1">
                Status: <span className="font-semibold">{status}</span>
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
