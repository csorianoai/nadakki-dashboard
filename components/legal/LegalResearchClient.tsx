"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLegalEffectiveTenantId, useLegalAgentRun } from "@/hooks/useLegal";
import { formatLegalAgentRunError } from "@/lib/api/legal";
import { trackEvent } from "@/lib/legal/telemetry";
import type { AgentRunResponse } from "@/types/legal";
import { LegalErrorState } from "@/components/legal/LegalErrorState";
import { LegalLoadingSkeleton } from "@/components/legal/LegalLoadingSkeleton";
import { buildChatHistorialFromMessages } from "@/lib/legal/build-chat-historial";
import type { LegalChatHistorialTurn } from "@/lib/legal/build-chat-historial";
import { countStoredUserTurns } from "@/lib/legal/research/citation-utils";
import { LoadingStages } from "@/components/legal/research/LoadingStages";
import { ResearchPapelFonts } from "@/components/legal/research/papel-blanco/ResearchPapelFonts";
import { ResearchSidebar } from "@/components/legal/research/papel-blanco/ResearchSidebar";
import { ResearchTopBar } from "@/components/legal/research/papel-blanco/ResearchTopBar";
import { ResearchEmptyState } from "@/components/legal/research/papel-blanco/ResearchEmptyState";
import { ResearchComposer } from "@/components/legal/research/papel-blanco/ResearchComposer";
import { ResearchDictamenView } from "@/components/legal/research/papel-blanco/ResearchDictamenView";
import { ResearchRecentDrawer } from "@/components/legal/research/papel-blanco/ResearchRecentDrawer";
import "@/styles/legal-research-papel-blanco.css";

const CHAT_AGENT = "chat_asesor_legal";
const MAX_CHARS = 4000;

type ChatMessage =
  | { role: "user"; content: string; sentAt?: string }
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

function readStoredSession(tenantId: string): { messages: ChatMessage[]; agent_id_active?: string } | null {
  try {
    const raw = sessionStorage.getItem(sessionKey(tenantId));
    if (!raw) return null;
    return JSON.parse(raw) as { messages: ChatMessage[]; agent_id_active?: string };
  } catch {
    return null;
  }
}

export default function LegalResearchClient() {
  const searchParams = useSearchParams();
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const initialAgent = searchParams.get("agent")?.trim() || CHAT_AGENT;
  const [agentId, setAgentId] = useState(initialAgent);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [highlightSourceId, setHighlightSourceId] = useState<string | null>(null);
  const [recentOpen, setRecentOpen] = useState(false);
  const [storedTurnCount, setStoredTurnCount] = useState(0);
  const [scrollEl, setScrollEl] = useState<HTMLElement | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const runHook = useLegalAgentRun(effectiveTenantId);

  useEffect(() => {
    const a = searchParams.get("agent")?.trim();
    if (a) setAgentId(a);
  }, [searchParams]);

  useEffect(() => {
    if (!effectiveTenantId) return;
    const raw = sessionStorage.getItem(sessionKey(effectiveTenantId));
    setStoredTurnCount(countStoredUserTurns(raw));
  }, [effectiveTenantId, messages]);

  useEffect(() => {
    if (!effectiveTenantId || messages.length === 0) return;
    sessionStorage.setItem(
      sessionKey(effectiveTenantId),
      JSON.stringify({ messages, agent_id_active: agentId, session_started_at: new Date().toISOString() }),
    );
  }, [effectiveTenantId, messages, agentId]);

  useEffect(() => {
    if (effectiveTenantId) {
      trackEvent("legal_page_view", { page: "research", tenant_id: effectiveTenantId, agent_id: agentId });
    }
  }, [effectiveTenantId, agentId]);

  const sendText = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || !effectiveTenantId) return;
      if (trimmed.length > MAX_CHARS) return;

      const historial = agentId === CHAT_AGENT ? buildChatHistorialFromMessages(messages) : undefined;
      const sentAt = new Date().toLocaleString("es-DO", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

      setMessages((m) => [...m, { role: "user", content: trimmed, sentAt }]);
      trackEvent("legal_agent_run_started", { agent_id: agentId, tenant_id: effectiveTenantId });
      const t0 = Date.now();

      try {
        const run = await runHook.run(agentId, buildInputs(agentId, trimmed, historial));
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
        trackEvent("legal_agent_run_failed", {
          agent_id: agentId,
          tenant_id: effectiveTenantId,
          error_type: "run_error",
          http_status: err.status ?? 0,
        });
        const msg = formatLegalAgentRunError(e);
        setMessages((m) => [...m, { role: "assistant", content: `**Error**\n${msg}` }]);
      }
    },
    [agentId, effectiveTenantId, messages, runHook],
  );

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text) return;
    setInput("");
    await sendText(text);
  }, [input, sendText]);

  const newChat = () => {
    setMessages([]);
    setHighlightSourceId(null);
    setInput("");
  };

  const restoreStoredSession = () => {
    if (!effectiveTenantId) return;
    const stored = readStoredSession(effectiveTenantId);
    if (stored?.messages?.length) {
      setMessages(stored.messages);
      if (stored.agent_id_active) setAgentId(stored.agent_id_active);
    }
    setRecentOpen(false);
  };

  const recentPreviews = useMemo(() => {
    if (!effectiveTenantId) return [];
    const stored = readStoredSession(effectiveTenantId);
    if (!stored?.messages?.length) return [];
    const firstUser = stored.messages.find((m) => m.role === "user");
    const label =
      firstUser && firstUser.role === "user"
        ? firstUser.content.slice(0, 80) + (firstUser.content.length > 80 ? "…" : "")
        : "Sesión guardada";
    return [{ label, messages: stored.messages }];
  }, [effectiveTenantId, storedTurnCount, recentOpen]);

  const dictamenTurns = useMemo(() => {
    const turns: { userQuery: string; queryDate?: string; assistantIndex: number }[] = [];
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (m.role === "assistant") {
        let userQuery = "";
        let queryDate: string | undefined;
        for (let j = i - 1; j >= 0; j--) {
          const prev = messages[j];
          if (prev.role === "user") {
            userQuery = prev.content;
            queryDate = prev.sentAt;
            break;
          }
        }
        turns.push({ userQuery, queryDate, assistantIndex: i });
      }
    }
    return turns;
  }, [messages]);

  const viewEmpty = messages.length === 0 && !runHook.loading;
  const recentCount = Math.max(storedTurnCount, recentPreviews.length > 0 ? countStoredUserTurns(
    effectiveTenantId ? sessionStorage.getItem(sessionKey(effectiveTenantId)) : null,
  ) : 0);

  if (!tenantHydrated) {
    return <LegalLoadingSkeleton variant="chat-bubble" />;
  }
  if (tenantError || !effectiveTenantId) {
    return <LegalErrorState message={tenantError || "Tenant no disponible"} />;
  }

  return (
    <ResearchPapelFonts>
      <ResearchSidebar tenantLabel={effectiveTenantId} />

      <div className="lr-main">
        <ResearchTopBar
          agentId={agentId}
          onAgentChange={setAgentId}
          recentCount={recentCount}
          onOpenRecent={() => setRecentOpen(true)}
        />

        <div
          ref={(el) => {
            scrollRef.current = el;
            setScrollEl(el);
          }}
          className="lr-canvas"
          id="legal-research-scroll"
        >
          {viewEmpty ? (
            <ResearchEmptyState
              onPickQuestion={(q) => void sendText(q)}
              onOpenRecent={() => setRecentOpen(true)}
              recentCount={recentCount}
            />
          ) : null}

          {dictamenTurns.map(({ userQuery, queryDate, assistantIndex }) => {
            const m = messages[assistantIndex];
            if (m.role !== "assistant") return null;
            return (
              <ResearchDictamenView
                key={assistantIndex}
                userQuery={userQuery}
                queryDate={queryDate}
                content={m.content}
                run={m.run}
                highlightSourceId={highlightSourceId}
                scrollContainer={scrollEl}
                onHighlightSourceId={setHighlightSourceId}
                onNewConsult={newChat}
                onFollowUp={(text) => void sendText(text)}
              />
            );
          })}

          {runHook.loading ? (
            <div className="lr-content">
              <LoadingStages isChatAgent={agentId === CHAT_AGENT} />
            </div>
          ) : null}
        </div>

        {viewEmpty ? (
          <ResearchComposer
            value={input}
            onChange={setInput}
            onSubmit={() => void send()}
            disabled={runHook.loading}
            maxChars={MAX_CHARS}
          />
        ) : null}
      </div>

      <ResearchRecentDrawer
        open={recentOpen}
        onClose={() => setRecentOpen(false)}
        previews={recentPreviews}
        onRestore={() => restoreStoredSession()}
      />
    </ResearchPapelFonts>
  );
}
