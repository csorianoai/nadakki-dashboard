import type { AgentRunResponse, Citation } from "@/types/legal";

/** DOM id for scroll targets (data-cite-id). */
export function citationDomId(sourceId: string): string {
  return `cite-${sourceId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 120)}`;
}

/** Backend may send article as "80" or "Art. 80" — avoid "Art. Art. 80". */
export function formatArticleLabel(article: string | undefined | null): string {
  const a = (article ?? "").trim();
  if (!a) return "—";
  if (/^art\.?\s/i.test(a)) return a.replace(/^art\.?\s*/i, "Art. ");
  return `Art. ${a}`;
}

export function buildCopyPayload(content: string, run?: AgentRunResponse): string {
  const parts = [content.trim()];
  if (run?.citations?.length) {
    parts.push("", "—— Citas ——");
    for (const c of run.citations) {
      parts.push(
        `- ${c.law_name} · ${formatArticleLabel(c.article)} · ${c.layer} · ${c.source_id}`,
        c.quote_or_summary,
      );
    }
  }
  if (run?.request_id) {
    parts.push("", `request_id: ${run.request_id}`);
  }
  return parts.join("\n");
}

export function scrollToCitation(sourceId: string, onHighlight?: (id: string) => void): void {
  const id = citationDomId(sourceId);
  onHighlight?.(sourceId);
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    el.classList.add("legal-cite-glow");
    window.setTimeout(() => el.classList.remove("legal-cite-glow"), 2200);
  }
}

export type AssistantChatMessage = {
  role: "assistant";
  content: string;
  run?: AgentRunResponse;
};

export function findLastAssistantIndex(messages: Array<{ role: string; run?: AgentRunResponse }>): number | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m.role === "assistant" && m.run) return i;
  }
  return null;
}
