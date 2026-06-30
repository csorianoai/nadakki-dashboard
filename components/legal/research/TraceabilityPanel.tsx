"use client";

import type { AgentMonitor, AgentRunResponse, Citation, RagMetadata } from "@/types/legal";
import { ResearchCitationCard } from "@/components/legal/research/ResearchCitationCard";
import { scrollToCitation } from "@/lib/legal/research/citation-utils";

type Tab = "citations" | "rag" | "monitor" | "audit";

type Props = {
  run: AgentRunResponse | undefined;
  tenantId: string;
  tab: Tab;
  onTabChange: (tab: Tab) => void;
  highlightSourceId: string | null;
  onHighlightSourceId: (id: string | null) => void;
};

function Row({ k, v, mono }: { k: string; v: string; mono?: boolean }) {
  return (
    <div className="flex justify-between gap-2 text-sm">
      <dt className="text-[var(--legal-text-secondary)]">{k}</dt>
      <dd className={`text-right text-zinc-200 ${mono ? "font-mono text-xs break-all" : ""}`}>{v}</dd>
    </div>
  );
}

function RagPanel({ meta }: { meta?: RagMetadata }) {
  if (!meta) return <p className="text-sm text-[var(--legal-text-secondary)]">Sin metadatos RAG.</p>;
  return (
    <dl className="space-y-2">
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
  if (!mon) return <p className="text-sm text-[var(--legal-text-secondary)]">Sin monitor.</p>;
  return (
    <div className="space-y-2 text-sm text-zinc-200">
      <p>
        Riesgo: <strong className="text-[var(--legal-accent)]">{mon.riesgo_evaluado || "—"}</strong>
      </p>
      {mon.alertas && mon.alertas.length > 0 ? (
        <ul className="list-disc pl-4 text-amber-100/90">
          {mon.alertas.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      ) : (
        <p className="text-emerald-300/90">Sin alertas del evaluador.</p>
      )}
      <p className="text-[var(--legal-text-secondary)]">
        Latency monitor: {mon.latency_ms != null ? `${mon.latency_ms} ms` : "—"}
      </p>
    </div>
  );
}

function AuditPanel({ run, tenantId }: { run: AgentRunResponse; tenantId: string }) {
  return (
    <div className="space-y-2 text-sm">
      <p className="font-mono text-xs break-all text-zinc-300">request_id: {run.request_id}</p>
      <p className="font-mono text-xs text-zinc-400">tenant: {run.tenant_id || tenantId}</p>
      {run.latency_ms != null ? (
        <p className="text-xs text-[var(--legal-text-secondary)]">latency_ms: {run.latency_ms}</p>
      ) : null}
      <p className="text-xs text-[var(--legal-text-secondary)]">status: {run.status}</p>
      <a
        className="inline-block text-[var(--legal-accent)] underline"
        href={`/legal/audit?request_id=${encodeURIComponent(run.request_id)}`}
      >
        Ver en /legal/audit
      </a>
    </div>
  );
}

export function TraceabilityPanel({
  run,
  tenantId,
  tab,
  onTabChange,
  highlightSourceId,
  onHighlightSourceId,
}: Props) {
  const tabs: { k: Tab; label: string }[] = [
    { k: "citations", label: "Citas" },
    { k: "rag", label: "RAG" },
    { k: "monitor", label: "Monitor" },
    { k: "audit", label: "Audit" },
  ];

  const citations = run?.citations ?? [];

  return (
    <section
      className="rounded-xl border border-[var(--legal-border)] bg-[var(--legal-surface-1)] p-4"
      aria-label="Trazabilidad de la respuesta seleccionada"
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--legal-border)] pb-2">
        <h3 className="text-sm font-semibold text-zinc-100">Trazabilidad</h3>
        <div className="flex flex-wrap gap-1">
          {tabs.map(({ k, label }) => (
            <button
              key={k}
              type="button"
              className={`rounded px-2 py-1 text-xs font-medium ${
                tab === k
                  ? "bg-[var(--legal-accent-strong)]/25 text-[var(--legal-accent)]"
                  : "text-[var(--legal-text-secondary)] hover:text-zinc-200"
              }`}
              onClick={() => onTabChange(k)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {!run ? (
        <p className="text-sm text-[var(--legal-text-secondary)]">Seleccione una respuesta del asistente.</p>
      ) : tab === "citations" ? (
        citations.length === 0 ? (
          <p className="text-sm text-[var(--legal-text-secondary)]">Sin citas en esta respuesta.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {citations.map((c: Citation, idx: number) => (
              <ResearchCitationCard
                key={`${c.source_id}-${idx}`}
                citation={c}
                active={highlightSourceId === c.source_id}
                onSelect={(id) => scrollToCitation(id, () => onHighlightSourceId(id))}
              />
            ))}
          </div>
        )
      ) : tab === "rag" ? (
        <RagPanel meta={run.rag_metadata} />
      ) : tab === "monitor" ? (
        <MonitorPanel mon={run.monitor} />
      ) : (
        <AuditPanel run={run} tenantId={tenantId} />
      )}
    </section>
  );
}

export type { Tab as TraceabilityTab };
