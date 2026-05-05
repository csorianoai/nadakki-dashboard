"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Scale, Send, Sparkles } from "lucide-react";
import { useLegalEffectiveTenantId, useLegalAgentRun } from "@/hooks/useLegal";
import { trackEvent } from "@/lib/legal/telemetry";
import type { AgentMonitor, AgentRunResponse, Citation, RagMetadata } from "@/types/legal";
import { CitationCard } from "@/components/legal/CitationCard";
import { LegalErrorState } from "@/components/legal/LegalErrorState";
import { LegalLoadingSkeleton } from "@/components/legal/LegalLoadingSkeleton";
import { LegalDisclaimer } from "@/components/legal/LegalDisclaimer";

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

function buildInputs(agentId: string, message: string): Record<string, unknown> {
  switch (agentId) {
    case CHAT_AGENT:
      return { mensaje: message, consulta: message };
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
  const [tab, setTab] = useState<"citations" | "rag" | "monitor" | "audit">("citations");
  const [sidebarOpen, setSidebarOpen] = useState(true);
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

  const lastAssistant = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === "assistant" && m.run) return m;
    }
    return null;
  }, [messages]);

  const send = useCallback(async () => {
    const text = input.trim();
    if (!text || !effectiveTenantId) return;
    if (text.length > MAX_CHARS) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    trackEvent("legal_agent_run_started", { agent_id: agentId, tenant_id: effectiveTenantId });
    const t0 = Date.now();
    try {
      const run = await runHook.run(agentId, buildInputs(agentId, text));
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
      let msg = err.message || "Error";
      if (http === 429) msg = "Límite de tasa excedido. Espere unos segundos.";
      else if (http === 504) msg = "Tiempo de espera agotado. Pruebe una consulta más específica.";
      else if (http >= 500) msg = `Error interno (${http}). Si persiste, reporte al equipo.`;
      setMessages((m) => [...m, { role: "assistant", content: `**Error**\n${msg}` }]);
    }
  }, [agentId, effectiveTenantId, input, runHook]);

  const newChat = () => {
    setMessages([]);
    if (effectiveTenantId) sessionStorage.removeItem(sessionKey(effectiveTenantId));
  };

  const copyLastRequestId = () => {
    const id = lastAssistant?.run.request_id;
    if (id) void navigator.clipboard.writeText(id);
  };

  const mockLlm = process.env.NEXT_PUBLIC_LEGAL_MOCK_LLM === "true";

  if (!tenantHydrated) {
    return <LegalLoadingSkeleton variant="chat-bubble" />;
  }
  if (tenantError || !effectiveTenantId) {
    return <LegalErrorState message={tenantError || "Tenant no disponible"} />;
  }

  const dynamicChips = lastAssistant?.run?.follow_up_suggestions;
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
    <div className="space-y-4">
      <p className="rounded-md border border-blue-100 bg-blue-50/90 px-3 py-2 text-xs text-slate-700 dark:border-blue-900 dark:bg-blue-950/50 dark:text-slate-200">
        <strong>Piloto controlado:</strong> respuestas con trazabilidad; copias y exportaciones pueden incluir{" "}
        <span className="font-medium">watermark</span> de auditoría para compliance bancario.
      </p>
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 dark:border-slate-800 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">Research</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400">Asistente legal con trazabilidad y fuentes.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400" htmlFor="legal-agent-select">
            Agente
          </label>
          <select
            id="legal-agent-select"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
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
            className={`rounded-full px-2 py-1 text-xs font-medium ${mockLlm ? "bg-amber-100 text-amber-900 dark:bg-amber-950" : "bg-emerald-100 text-emerald-900 dark:bg-emerald-950"}`}
          >
            {mockLlm ? "LLM mock (env)" : "LLM live"}
          </span>
          <button
            type="button"
            onClick={newChat}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700"
            aria-label="Nueva conversación"
          >
            Nueva conversación
          </button>
          <button
            type="button"
            onClick={copyLastRequestId}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm dark:border-slate-700"
            aria-label="Copiar último Request ID"
          >
            Copiar Request ID
          </button>
        </div>
      </div>

      {agentId !== CHAT_AGENT && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-950/40">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden />
            <div>
              <p className="font-medium text-amber-900 dark:text-amber-100">Agente en optimización (Worker M)</p>
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Scoring heurístico pendiente. Para demo se recomienda {CHAT_AGENT} con LLM validado.
              </p>
              <button
                type="button"
                className="mt-2 text-sm font-medium text-amber-900 underline dark:text-amber-100"
                onClick={() => setAgentId(CHAT_AGENT)}
              >
                Volver a {CHAT_AGENT}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="min-h-[420px] flex-1 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:max-w-[60%]">
          <div className="max-h-[calc(100vh-280px)] space-y-4 overflow-y-auto p-4">
            {messages.length === 0 && (
              <div className="flex flex-col items-center gap-4 py-6">
                <div className="rounded-full bg-blue-50 p-3 dark:bg-blue-950/50">
                  <Sparkles className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-slate-800 dark:text-slate-100">Consulta legal con IA</p>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Seleccione un tema o escriba su consulta.</p>
                </div>
                <div className="grid w-full grid-cols-2 gap-2 sm:grid-cols-4">
                  {([
                    ["Penal", "Plazos de prescripcion para delitos financieros en RD"],
                    ["Civil", "Requisitos para demanda en responsabilidad civil extracontractual"],
                    ["Laboral", "Calculo de prestaciones laborales por desahucio del empleador"],
                    ["Comercial", "Requisitos de constitucion de una SRL segun Ley 479-08"],
                    ["Contratos", "Validez de clausula penal del 50% en contrato de prestamo"],
                    ["Inmobiliario", "Proceso de saneamiento de titulo de propiedad inmobiliaria"],
                    ["Compliance", "Obligaciones AML/KYC para entidades financieras segun Ley 155-17"],
                    ["Tributario", "Regimen de facturacion electronica y deberes del contribuyente"],
                  ] as const).map(([area, prompt]) => (
                    <button
                      key={area}
                      type="button"
                      className="group rounded-lg border border-slate-200 bg-white p-3 text-left transition-colors hover:border-blue-400 hover:bg-blue-50/50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-blue-600 dark:hover:bg-blue-950/30"
                      onClick={() => {
                        setInput(prompt);
                        document.getElementById("legal-research-input")?.focus();
                      }}
                    >
                      <span className="text-xs font-semibold text-blue-600 dark:text-blue-400">{area}</span>
                      <p className="mt-1 line-clamp-2 text-xs text-slate-600 dark:text-slate-400">{prompt}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) =>
              m.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[80%] rounded-2xl rounded-br-sm bg-blue-50 px-4 py-2 text-sm dark:bg-blue-950/60">
                    <p className="whitespace-pre-wrap text-slate-900 dark:text-slate-100">{m.content}</p>
                  </div>
                </div>
              ) : (
                <div key={i} className="flex justify-start">
                  <div className="max-w-[85%] space-y-2 rounded-2xl rounded-bl-sm border border-slate-200 bg-slate-50 p-4 text-sm dark:border-slate-700 dark:bg-slate-950/50">
                    <div className="flex items-center gap-2 text-slate-500">
                      <Scale className="h-4 w-4" aria-hidden />
                      <span>Asistente</span>
                    </div>
                    <div className="whitespace-pre-wrap text-slate-900 dark:text-slate-100">{m.content}</div>
                    {"run" in m && m.run?.monitor?.alertas && m.run.monitor.alertas.length > 0 && (
                      <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-950 dark:border-amber-800 dark:bg-amber-950/50">
                        <strong>Alertas:</strong> {m.run!.monitor!.alertas!.join(", ")}
                      </div>
                    )}
                    {"run" in m && m.run?.requiere_revision_abogado && (
                      <p className="text-xs text-amber-800 dark:text-amber-200">
                        {m.run!.disclaimer_legal?.es || "Revisión por abogado autorizado requerida."}
                      </p>
                    )}
                    {"run" in m && m.run?.request_id && (
                      <p className="font-mono text-[10px] text-slate-500">request_id: {m.run!.request_id}</p>
                    )}
                  </div>
                </div>
              )
            )}
            {runHook.loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-500 dark:bg-slate-800">
                  Analizando con base normativa…
                </div>
              </div>
            )}
          </div>
          <div className="border-t border-slate-200 p-3 dark:border-slate-800">
            <div className="mb-2 flex flex-wrap gap-2">
            {prompts.map((p, idx) => (
              <button
                key={idx}
                  type="button"
                  className="rounded-full border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-left text-xs text-blue-800 transition-colors hover:border-blue-400 hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/40 dark:text-blue-200 dark:hover:bg-blue-900/60"
                  onClick={() => setInput(p)}
                >
                  {p.length > 60 ? `${p.slice(0, 60)}…` : p}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea
                id="legal-research-input"
                aria-label="Consulta legal"
                className="min-h-[48px] flex-1 resize-y rounded-lg border border-slate-300 bg-white p-2 text-sm dark:border-slate-700 dark:bg-slate-950"
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
                className="self-end rounded-lg bg-blue-600 p-3 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="mt-1 text-right text-xs text-slate-400">{input.length}/{MAX_CHARS}</p>
          </div>
        </div>

        <aside
          className={`w-full flex-1 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:max-w-[40%] ${sidebarOpen ? "" : "hidden lg:block"}`}
        >
          <div className="mb-3 flex gap-2 border-b border-slate-200 pb-2 dark:border-slate-800">
            {(
              [
                ["citations", "Citas"],
                ["rag", "RAG"],
                ["monitor", "Monitor"],
                ["audit", "Audit"],
              ] as const
            ).map(([k, label]) => (
              <button
                key={k}
                type="button"
                className={`rounded px-2 py-1 text-xs font-medium ${tab === k ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-400"}`}
                onClick={() => setTab(k)}
              >
                {label}
              </button>
            ))}
          </div>
          {!lastAssistant?.run ? (
            <p className="text-sm text-slate-500">Ejecute una consulta para ver fuentes y metadatos.</p>
          ) : tab === "citations" ? (
            <div className="space-y-3">
              {(lastAssistant.run.citations ?? []).length === 0 ? (
                <p className="text-sm text-slate-500">Sin citas en la última respuesta.</p>
              ) : (
                (lastAssistant.run.citations ?? []).map((c: Citation, idx: number) => (
                  <CitationCard key={`${c.source_id}-${idx}`} citation={c} />
                ))
              )}
            </div>
          ) : tab === "rag" ? (
            <RagPanel meta={lastAssistant.run.rag_metadata} />
          ) : tab === "monitor" ? (
            <MonitorPanel mon={lastAssistant.run.monitor} />
          ) : (
            <AuditMini run={lastAssistant.run} tenantId={effectiveTenantId} />
          )}
        </aside>
      </div>

      <button
        type="button"
        className="lg:hidden rounded border border-slate-300 px-3 py-1 text-sm dark:border-slate-700"
        onClick={() => setSidebarOpen((s) => !s)}
        aria-label="Alternar panel lateral"
      >
        Fuentes / análisis
      </button>

      <LegalDisclaimer variant="compact" />
    </div>
  );
}

function RagPanel({ meta }: { meta?: RagMetadata }) {
  if (!meta) return <p className="text-sm text-slate-500">Sin metadatos RAG en la respuesta.</p>;
  return (
    <dl className="space-y-2 text-sm">
      <Row k="Pack hash" v={meta.pack_hash || "—"} mono />
      <Row k="Capa 1" v={String(meta.fuentes_capa_1_count ?? "—")} />
      <Row k="Capa 2" v={String(meta.fuentes_capa_2_count ?? "—")} />
      <Row k="Domain filter" v={meta.domain_filter_applied ? "sí" : "no"} />
      <Row k="Domain" v={meta.domain || "—"} />
      <Row k="RAG latency" v={meta.latency_ms != null ? `${meta.latency_ms} ms` : "—"} />
      <Row k="Query hash" v={meta.query_hash || "—"} mono />
    </dl>
  );
}

function MonitorPanel({ mon }: { mon?: AgentMonitor }) {
  if (!mon) return <p className="text-sm text-slate-500">Sin monitor en la respuesta.</p>;
  return (
    <div className="space-y-2 text-sm">
      <p>
        Riesgo: <strong>{mon.riesgo_evaluado || "—"}</strong>
      </p>
      {mon.alertas && mon.alertas.length > 0 ? (
        <ul className="list-disc pl-4">
          {mon.alertas.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      ) : (
        <p className="text-emerald-700 dark:text-emerald-300">Sin alertas del evaluador.</p>
      )}
      <p>Latency monitor: {mon.latency_ms != null ? `${mon.latency_ms} ms` : "—"}</p>
    </div>
  );
}

function AuditMini({ run, tenantId }: { run: AgentRunResponse; tenantId: string }) {
  return (
    <div className="space-y-2 text-sm">
      <p className="font-mono text-xs break-all">request_id: {run.request_id}</p>
      <p className="font-mono text-xs">tenant: {run.tenant_id || tenantId}</p>
      <a className="text-blue-600 underline dark:text-blue-400" href={`/legal/audit?request_id=${encodeURIComponent(run.request_id)}`}>
        Ver en /legal/audit
      </a>
    </div>
  );
}

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-slate-500">{k}</dt>
      <dd className={`text-right ${mono ? "font-mono text-xs break-all" : ""}`}>{v}</dd>
    </div>
  );
}
