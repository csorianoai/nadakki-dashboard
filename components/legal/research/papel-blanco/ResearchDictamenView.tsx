"use client";

import { MessageSquare, ClipboardCheck, AlertTriangle, Eye, MessageCircle } from "lucide-react";
import type { AgentRunResponse, Citation } from "@/types/legal";
import {
  formatRiskLabel,
  scrollToCitation,
} from "@/lib/legal/research/citation-utils";
import {
  parseConclusionChips,
  splitBySections,
  stripConclusionStructuredPrefix,
} from "@/lib/legal/research/split-by-sections";
import { resolveCitationTipo } from "@/lib/legal/research/citation-type";
import { PapelCitationCard } from "@/components/legal/research/papel-blanco/PapelCitationCard";
import {
  extractListItems,
  ResearchMarkdown,
  ResearchMarkdownList,
} from "@/components/legal/research/papel-blanco/ResearchMarkdown";
import { ResearchActionsBlock } from "@/components/legal/research/papel-blanco/ResearchActionsBlock";
import { Ley91Block } from "@/components/legal/research/papel-blanco/Ley91Block";

type Props = {
  userQuery: string;
  queryDate?: string;
  content: string;
  run?: AgentRunResponse;
  highlightSourceId: string | null;
  scrollContainer: HTMLElement | null;
  onHighlightSourceId: (id: string | null) => void;
  onNewConsult: () => void;
  onFollowUp: (text: string) => void;
};

function countSourcesByTipo(citations: Citation[]) {
  let normativa = 0;
  let jurisprudencia = 0;
  let bibliografica = 0;
  for (const c of citations) {
    const t = resolveCitationTipo(c);
    if (t === "normativa") normativa++;
    else if (t === "jurisprudencia") jurisprudencia++;
    else bibliografica++;
  }
  return { normativa, jurisprudencia, bibliografica };
}

function buildSourcesPill(citations: Citation[]): string {
  const { normativa, jurisprudencia, bibliografica } = countSourcesByTipo(citations);
  const parts: string[] = [];
  if (normativa) parts.push(`${normativa} normativa${normativa > 1 ? "s" : ""}`);
  if (jurisprudencia) parts.push(`${jurisprudencia} jurisprudencia`);
  if (bibliografica) parts.push(`${bibliografica} bibliográfica${bibliografica > 1 ? "s" : ""}`);
  if (parts.length === 0) return "Sin fuentes estructuradas";
  return `${parts.join(" · ")} · rigor alto`;
}

function renderRecommendationSteps(md: string) {
  const items = extractListItems(md);
  if (items) {
    return (
      <ol className="lr-steps-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ol>
    );
  }
  return (
    <ResearchMarkdown content={md} citations={[]} />
  );
}

export function ResearchDictamenView({
  userQuery,
  queryDate,
  content,
  run,
  highlightSourceId,
  scrollContainer,
  onHighlightSourceId,
  onNewConsult,
  onFollowUp,
}: Props) {
  const isError = content.startsWith("**Error**");
  const sections = splitBySections(content);
  const citations = run?.citations ?? [];
  const requestId = run?.request_id ?? "unknown";
  const riskLabel = formatRiskLabel(run?.monitor?.riesgo_evaluado);

  const handleCiteClick = (sourceId: string) => {
    scrollToCitation(sourceId, {
      requestId,
      scrollContainer,
      onHighlight: (id) => onHighlightSourceId(id),
    });
  };

  if (isError) {
    return (
      <div className="lr-content">
        <div className="lr-query-card">
          <p className="lr-query-text" style={{ color: "#b91c1c" }}>
            {content.replace(/^\*\*Error\*\*\n?/, "")}
          </p>
        </div>
        <Ley91Block />
      </div>
    );
  }

  const conclusionMd = sections.conclusion;
  const conclusionChips = conclusionMd ? parseConclusionChips(conclusionMd) : null;
  const conclusionBody = conclusionMd ? stripConclusionStructuredPrefix(conclusionMd) : undefined;

  const hechosList = sections.hechos ? extractListItems(sections.hechos) : null;

  const rag = run?.rag_metadata;
  const metaParts = [
    rag?.fuentes_capa_1_count != null ? `capa1 ${rag.fuentes_capa_1_count}` : null,
    countSourcesByTipo(citations).jurisprudencia
      ? `jurisprudencia ${countSourcesByTipo(citations).jurisprudencia}`
      : null,
    rag?.fuentes_capa_2_count != null ? `capa2 ${rag.fuentes_capa_2_count}` : null,
    run?.latency_ms != null ? `${run.latency_ms} ms` : rag?.latency_ms != null ? `${rag.latency_ms} ms` : null,
    rag?.pack_hash ? `pack_hash ${rag.pack_hash}` : null,
    rag?.query_hash ? `query_hash ${rag.query_hash}` : null,
    run?.request_id ? `request_id ${run.request_id}` : null,
  ].filter(Boolean);

  return (
    <article className="lr-content lr-dictamen" aria-label="Dictamen legal">
      {/* Bloque 1 — Consulta */}
      <section className="lr-query-card">
        <div className="lr-query-header">
          <div>
            <div className="lr-query-label">
              <MessageSquare size={14} style={{ marginRight: 6, verticalAlign: -2 }} aria-hidden />
              TU CONSULTA
            </div>
            {queryDate ? <div className="lr-query-date">{queryDate}</div> : null}
          </div>
          <button type="button" className="lr-btn-ghost" onClick={onNewConsult}>
            + Nueva consulta
          </button>
        </div>
        <p className="lr-query-text">{userQuery}</p>
      </section>

      {/* Bloque 2 — Conclusión */}
      {sections.hasCanonicalHeaders && conclusionBody ? (
        <section className="lr-conclusion">
          <div className="lr-conclusion-header">
            <div className="lr-block-label">Conclusión</div>
            {riskLabel ? (
              <span className="lr-risk-pill">
                <span className="lr-risk-pill-dot" aria-hidden />
                {riskLabel}
              </span>
            ) : null}
          </div>
          {conclusionChips ? (
            <div className="lr-chips-row" aria-label="Resumen estructurado">
              {conclusionChips.map(({ label, value }) => (
                <span key={`${label}-${value}`} className="lr-summary-chip">
                  <strong>{value}</strong> {label}
                </span>
              ))}
            </div>
          ) : null}
          <ResearchMarkdown
            content={conclusionBody}
            citations={citations}
            requestId={requestId}
            onCitationClick={handleCiteClick}
          />
        </section>
      ) : riskLabel && !sections.hasCanonicalHeaders ? (
        <div className="lr-conclusion-header" style={{ marginBottom: 16 }}>
          <span className="lr-risk-pill">
            <span className="lr-risk-pill-dot" aria-hidden />
            {riskLabel}
          </span>
        </div>
      ) : null}

      {/* Bloque 3 — Hechos */}
      {sections.hechos ? (
        <section className="lr-section-card">
          <div className="lr-block-label">
            <ClipboardCheck size={14} aria-hidden />
            Hechos y supuestos
          </div>
          {hechosList ? (
            <ResearchMarkdownList items={hechosList} />
          ) : (
            <ResearchMarkdown content={sections.hechos} citations={citations} onCitationClick={handleCiteClick} />
          )}
          <p className="lr-supuestos-note">
            La opinión es válida únicamente para estos supuestos; si cambia un dato, varía el cálculo.
          </p>
        </section>
      ) : null}

      {/* Bloque 4 — Análisis (fallback = documento único) */}
      {sections.hasCanonicalHeaders && sections.analisis ? (
        <section className="lr-section-card lr-section-card--surface">
          <div className="lr-block-label lr-block-label--ink">Análisis normativo</div>
          <ResearchMarkdown
            content={sections.analisis}
            citations={citations}
            requestId={requestId}
            onCitationClick={handleCiteClick}
          />
        </section>
      ) : !sections.hasCanonicalHeaders && sections.fallbackDocument ? (
        <section className="lr-section-card lr-section-card--surface">
          <div className="lr-block-label lr-block-label--ink">Análisis normativo</div>
          <ResearchMarkdown
            content={sections.fallbackDocument}
            citations={citations}
            requestId={requestId}
            onCitationClick={handleCiteClick}
          />
        </section>
      ) : null}

      {/* Bloque 5 — Recomendación */}
      {sections.recomendacion ? (
        <section className="lr-section-card lr-section-card--surface" style={{ borderTop: "1px solid var(--lr-surface-bd)" }}>
          <div className="lr-block-label lr-block-label--accent">Recomendación · Próximos pasos</div>
          {renderRecommendationSteps(sections.recomendacion)}
        </section>
      ) : null}

      {/* Bloque 6 — Límites */}
      {sections.limites ? (
        <section className="lr-section-card">
          <div className="lr-block-label lr-block-label--gold">
            <AlertTriangle size={14} aria-hidden />
            Límites y advertencias
          </div>
          <div className="lr-limites-panel">
            <ResearchMarkdown content={sections.limites} citations={citations} onCitationClick={handleCiteClick} />
          </div>
        </section>
      ) : null}

      {/* Bloque 7 — Fuentes */}
      <section className="lr-section-card lr-section-card--surface" style={{ marginTop: 8 }}>
        <div className="lr-sources-header">
          <h3 className="lr-sources-title">
            <Eye size={18} style={{ marginRight: 8, verticalAlign: -3 }} aria-hidden />
            Fuentes y trazabilidad
          </h3>
          {citations.length > 0 ? (
            <span className="lr-sources-pill">{buildSourcesPill(citations)}</span>
          ) : null}
        </div>
        {citations.length > 0 ? (
          <div className="lr-sources-grid">
            {citations.map((c, idx) => (
              <PapelCitationCard
                key={`${c.source_id}-${idx}`}
                citation={c}
                requestId={requestId}
                highlighted={highlightSourceId === c.source_id}
                onActivate={() => handleCiteClick(c.source_id)}
              />
            ))}
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 14, color: "var(--lr-sub)" }}>Sin citas estructuradas en esta respuesta.</p>
        )}
        {metaParts.length > 0 ? <p className="lr-meta-line">{metaParts.join(" · ")}</p> : null}
      </section>

      {/* Bloque 8 — Profundizar */}
      {run?.follow_up_suggestions && run.follow_up_suggestions.length > 0 ? (
        <section style={{ marginTop: 22 }} data-noprint>
          <div className="lr-block-label lr-block-label--ink">
            <MessageCircle size={14} aria-hidden />
            Profundizar
          </div>
          <div>
            {run.follow_up_suggestions.map((s) => (
              <button
                key={s}
                type="button"
                className="lr-follow-chip"
                onClick={() => onFollowUp(s)}
              >
                {s}
                <span className="lr-follow-arrow" aria-hidden>
                  →
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {/* Bloque 9 — Acciones */}
      {run ? <ResearchActionsBlock content={content} run={run} /> : null}

      {/* Bloque 10 — Ley 91 */}
      <Ley91Block />
    </article>
  );
}
