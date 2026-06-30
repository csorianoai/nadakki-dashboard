"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Send } from "lucide-react";
import { useLegalEffectiveTenantId, useLegalAgentRun } from "@/hooks/useLegal";
import { formatLegalAgentRunError } from "@/lib/api/legal";
import { trackEvent } from "@/lib/legal/telemetry";
import type { AgentRunResponse } from "@/types/legal";
import { LegalErrorState } from "@/components/legal/LegalErrorState";
import { LegalLoadingSkeleton } from "@/components/legal/LegalLoadingSkeleton";
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer";
import { buildChatHistorialFromMessages } from "@/lib/legal/build-chat-historial";
import type { LegalChatHistorialTurn } from "@/lib/legal/build-chat-historial";
import { findLastAssistantIndex } from "@/lib/legal/research/citation-utils";
import { AssistantResponseBlock } from "@/components/legal/research/AssistantResponseBlock";
import { EmptyWelcome } from "@/components/legal/research/EmptyWelcome";
import { FollowUpChips } from "@/components/legal/research/FollowUpChips";
import { LoadingStages } from "@/components/legal/research/LoadingStages";
import { TraceabilityPanel, type TraceabilityTab } from "@/components/legal/research/TraceabilityPanel";

const CHAT_AGENT = "chat_asesor_legal";
const MAX_CHARS = 4000;

const STATIC_FALLBACK_CHIPS = [
  "¿Cuál es el capital mínimo para una entidad de intermediación financiera?",
  "¿Qué obligaciones AML tiene un banco según Ley 155-17?",
  "¿Es válida una cláusula penal del 50% en contrato de préstamo?",
];

type ChatMessage =
  | { role: "user"; content: string }
  | {
      role: "assistant";
      content: string;
      run?: AgentRunResponse;
    };

function sessionKey(tenantId: string) {
  return `legal_research_session_${tenantId}`;
}

function buildInputs(
  agentId: string,
  message: string,
  historial?: LegalChatHistorialTurn[],
): Record<string, unknown> {
  switch (agentId) {
    case CHAT_AGENT:
      return {
        mensaje: message,
        consulta: message,
        ...(historial && historial.length > 0 ? { historial } : {}),
      };
    case "analizador_riesgo_contractual":
      return { contrato: message, tipo_analisis: "riesgo_contractual" };
    case "validador_amlkyc":
      return { consulta: message };
    case "calculador_plazos_procesales":
      return { texto: message };
    case "validador_citas_legales":
      return { texto: message };
    case "verificador_prescripcion":
      return { texto: message };
    default:
      return { texto: message, consulta: message };
  }
}

export default function LegalResearchClient() {
  const searchParams = useSearchParams();
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const initialAgent = searchParams.get("agent")?.trim() || CHAT_AGENT;
  const [agentId, setAgentId] = useState(initialAgent);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [tab, setTab] = useState<TraceabilityTab>("citations");
  const [activeAssistantIndex, setActiveAssistantIndex] = useState<number | null>(null);
  const [highlightSourceId, setHighlightSourceId] = useState<string | null>(null);
  const runHook = useLegalAgentRun(effectiveTenantId);

  useEffect(() => {
    const a = searchParams.get("agent")?.trim();
    if (a) setAgentId(a);
  }, [searchParams]);

  useEffect(() => {
    if (!effectiveTenantId) return;
    const raw = sessionStorage.getItem(sessionKey(effectiveTenantId));
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as { messages?: ChatMessage[]; agent_id_active?: string };
      if (Array.isArray(parsed.messages)) setMessages(parsed.messages);
      if (parsed.agent_id_active) setAgentId(parsed.agent_id_active);
    } catch {
      /* ignore */
    }
  }, [effectiveTenantId]);

  useEffect(() => {
    if (!effectiveTenantId || messages.length === 0) return;
    sessionStorage.setItem(
      sessionKey(effectiveTenantId),
      JSON.stringify({ messages, agent_id_active: agentId, session_started_at: new Date().toISOString() })
    );
  }, [effectiveTenantId, messages, agentId]);

  useEffect(() => {
    if (effectiveTenantId) {
      trackEvent("legal_page_view", { page: "research", tenant_id: effectiveTenantId, agent_id: agentId });
    }
  }, [effectiveTenantId, agentId]);

  useEffect(() => {
    const idx = findLastAssistantIndex(messages);
    if (idx != null) setActiveAssistantIndex(idx);
  }, [messages]);

  const activeAssistant = useMemo(() => {
    if (activeAssistantIndex != null) {
      const m = messages[activeAssistantIndex];
      if (m?.role === "assistant") return m;
    }
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant" && m.run) return m;
    }
    return null;
  }, [messages, activeAssistantIndex]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !effectiveTenantId) return;
    if (text.length > MAX_CHARS) return;
    setInput("");
    const historial = agentId === CHAT_AGENT ? buildChatHistorialFromMessages(messages) : undefined;
    setMessages((m) => [...m, { role: "user", content: text }]);
    trackEvent("legal_agent_run_started", { agent_id: agentId, tenant_id: effectiveTenantId });
    const t0 = Date.now();
    try {
      const run = await runHook.run(agentId, buildInputs(agentId, text, historial));
      setMessages((m) => [...m, { role: "assistant", content: run.respuesta || "", run }]);
      trackEvent("legal_agent_run_completed", {
        agent_id: agentId,
        tenant_id: effectiveTenantId,
        status: run.status,
        latency_ms: run.latency_ms ?? Date.now() - t0,
        citations_count: run.citations?.length ?? 0,
      });
    } catch (e: unknown) {
      const err = e as { status?: number; message?: string };
      const http = err.status ?? 0;
      trackEvent("legal_agent_run_failed", {
        agent_id: agentId,
        tenant_id: effectiveTenantId,
        error_type: "run_error",
        http_status: http,
      });
      const msg = formatLegalAgentRunError(e);
      setMessages((m) => [...m, { role: "assistant", content: `**Error**\n${msg}` }]);
    }
  }, [agentId, effectiveTenantId, input, messages, runHook]);

  const newChat = () => {
    setMessages([]);
    setActiveAssistantIndex(null);
    setHighlightSourceId(null);
    if (effectiveTenantId) sessionStorage.removeItem(sessionKey(effectiveTenantId));
  };

  const mockLlm = process.env.NEXT_PUBLIC_LEGAL_MOCK_LLM === "true";

  if (!tenantHydrated) {
    return <LegalLoadingSkeleton variant="chat-bubble" />;
  }
  if (tenantError || !effectiveTenantId) {
    return <LegalErrorState message={tenantError || "Tenant no disponible"} />;
  }

  const dynamicChips = activeAssistant?.run?.follow_up_suggestions;
  const prompts =
    agentId !== CHAT_AGENT
      ? [
          "Contrato de préstamo con interés elevado y cláusula penal 50%",
          "Cláusula de mora en hipoteca — riesgo reputacional",
        ]
      : dynamicChips && dynamicChips.length > 0
        ? dynamicChips
        : STATIC_FALLBACK_CHIPS;

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <header className="border-b border-[var(--legal-border)] pb-4">
        <p className="mb-3 rounded-md border border-[var(--legal-accent-strong)]/25 bg-[var(--legal-accent-strong)]/10 px-3 py-2 text-xs text-[var(--legal-text-secondary)]">
          <strong className="text-[var(--legal-accent)]">Piloto controlado:</strong> respuestas con trazabilidad;
          exportaciones futuras pueden incluir watermark de auditoría.
        </p>
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-100">Consulta legal</h1>
            <p className="text-sm text-[var(--legal-text-secondary)]">
              Investigación · asistente con fuentes normativas verificadas
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <label className="text-xs text-[var(--legal-text-secondary)]" htmlFor="legal-agent-select">
              Agente
            </label>
            <select
              id="legal-agent-select"
              className="rounded-lg border border-[var(--legal-border)] bg-[var(--legal-surface-1)] px-3 py-2 text-sm text-zinc-100"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
            >
              <option value={CHAT_AGENT}>{CHAT_AGENT}</option>
              <option value="analizador_riesgo_contractual">analizador_riesgo_contractual</option>
              <option value="validador_amlkyc">validador_amlkyc</option>
              <option value="calculador_plazos_procesales">calculador_plazos_procesales</option>
              <option value="validador_citas_legales">validador_citas_legales</option>
              <option value="verificador_prescripcion">verificador_prescripcion</option>
            </select>
            <span
              className={`rounded-full px-2 py-1 text-xs font-medium ${
                mockLlm ? "bg-amber-900/50 text-amber-100" : "bg-emerald-900/40 text-emerald-100"
              }`}
            >
              {mockLlm ? "LLM mock" : "LLM live"}
            </span>
          </div>
        </div>
        <p className="mt-2 text-xs text-zinc-500">
          Filtro por área legal:{" "}
          <span className="rounded border border-zinc-700 px-1.5 py-0.5 text-zinc-400">Próximamente</span>{" "}
          (el backend aún no envía etiquetas en citas)
        </p>
      </header>

      <div className="space-y-4">
        {messages.length === 0 && !runHook.loading ? (
          <EmptyWelcome onPickPrompt={setInput} />
        ) : null}

        {messages.map((m, i) =>
          m.role === "user" ? (
            <div key={i} className="flex justify-end">
              <div className="max-w-[85%] rounded-2xl rounded-br-md border border-[var(--legal-border)] bg-[var(--legal-surface-2)] px-4 py-3 text-sm text-zinc-100">
                <p className="whitespace-pre-wrap">{m.content}</p>
              </div>
            </div>
          ) : (
            <AssistantResponseBlock
              key={i}
              content={m.content}
              run={m.run}
              selected={activeAssistantIndex === i}
              highlightSourceId={highlightSourceId}
              onSelect={() => setActiveAssistantIndex(i)}
              onHighlightSourceId={setHighlightSourceId}
              onNewChat={newChat}
            />
          ),
        )}

        {runHook.loading ? <LoadingStages isChatAgent={agentId === CHAT_AGENT} /> : null}
      </div>

      {activeAssistant?.run ? (
        <TraceabilityPanel
          run={activeAssistant.run}
          tenantId={effectiveTenantId}
          tab={tab}
          onTabChange={setTab}
          highlightSourceId={highlightSourceId}
          onHighlightSourceId={setHighlightSourceId}
        />
      ) : null}

      <footer className="sticky bottom-0 z-10 rounded-xl border border-[var(--legal-border)] bg-[var(--legal-bg)]/95 p-4 backdrop-blur-md">
        <FollowUpChips prompts={prompts} onSelect={setInput} disabled={runHook.loading} />
        <div className="mt-3 flex gap-2">
          <textarea
            id="legal-research-input"
            aria-label="Consulta legal"
            className="min-h-[52px] flex-1 resize-y rounded-lg border border-[var(--legal-border)] bg-[var(--legal-surface-1)] p-3 text-sm text-zinc-100 placeholder:text-zinc-500"
            rows={2}
            maxLength={MAX_CHARS}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                e.preventDefault();
                void send();
              }
              if (e.key === "Escape") setInput("");
            }}
            disabled={runHook.loading}
          />
          <button
            type="button"
            aria-label="Enviar consulta"
            disabled={runHook.loading || !input.trim()}
            onClick={() => void send()}
            className="self-end rounded-lg bg-[var(--legal-accent-strong)] px-4 py-3 text-zinc-950 hover:brightness-110 disabled:opacity-50"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
        <p className="mt-1 text-right text-xs text-zinc-500">
          {input.length}/{MAX_CHARS}
        </p>
      </footer>

      <LegalDisclaimer variant="compact" />
    </div>
  );
}
