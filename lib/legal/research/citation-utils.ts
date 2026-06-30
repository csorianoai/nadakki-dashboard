import type { AgentRunResponse, Citation } from "@/types/legal";

/** DOM id for scroll targets — scoped per message when request_id is known. */
export function citationDomId(sourceId: string, requestId?: string): string {
  const base = sourceId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 80);
  if (requestId) {
    const req = requestId.replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 40);
    return `cite-${req}-${base}`;
  }
  return `cite-${base}`;
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

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function scrollToCitation(
  sourceId: string,
  optionsOrOnHighlight?:
    | {
        requestId?: string;
        scrollContainer?: HTMLElement | null;
        onHighlight?: (id: string) => void;
      }
    | ((id: string) => void),
): void {
  const options = typeof optionsOrOnHighlight === "function" ? { onHighlight: optionsOrOnHighlight } : optionsOrOnHighlight;
  const id = citationDomId(sourceId, options?.requestId);
  options?.onHighlight?.(sourceId);

  const el = document.getElementById(id);
  if (!el) return;

  const container = options?.scrollContainer;
  if (container) {
    const elRect = el.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();
    const targetTop = container.scrollTop + (elRect.top - containerRect.top) - container.clientHeight / 2 + elRect.height / 2;
    container.scrollTo({
      top: Math.max(0, targetTop),
      behavior: prefersReducedMotion() ? "auto" : "smooth",
    });
  } else {
    el.scrollIntoView({ behavior: prefersReducedMotion() ? "auto" : "smooth", block: "center" });
  }

  el.classList.add("legal-cite-glow");
  window.setTimeout(() => el.classList.remove("legal-cite-glow"), prefersReducedMotion() ? 0 : 2200);
}

/** Match inline [Art. NNN] references to citation cards by article label. */
export function findCitationByArticleRef(ref: string, citations: Citation[]): Citation | undefined {
  const norm = ref.replace(/^\[|\]$/g, "").trim().toLowerCase();
  return citations.find((c) => {
    const label = formatArticleLabel(c.article).toLowerCase();
    const bare = c.article.trim().toLowerCase();
    return norm === label || norm === bare || norm === `[${label}]`;
  });
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

export function formatRiskLabel(riesgo?: "low" | "medium" | "high"): string | null {
  if (!riesgo) return null;
  const map: Record<string, string> = {
    low: "Riesgo bajo",
    medium: "Riesgo medio",
    high: "Riesgo alto",
  };
  return map[riesgo] ?? null;
}

export function countStoredUserTurns(raw: string | null): number {
  if (!raw) return 0;
  try {
    const parsed = JSON.parse(raw) as { messages?: { role: string }[] };
    return parsed.messages?.filter((m) => m.role === "user").length ?? 0;
  } catch {
    return 0;
  }
}
