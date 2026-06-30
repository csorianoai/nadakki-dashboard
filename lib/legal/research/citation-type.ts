import type { Citation } from "@/types/legal";

export type CitationTipo = "normativa" | "jurisprudencia" | "bibliografica";

/** Derive display tipo from backend fields only — no invented jurisprudencia without signal. */
export function resolveCitationTipo(citation: Citation): CitationTipo {
  if (citation.layer === "capa_1") return "normativa";
  const haystack = `${citation.law_name} ${citation.quote_or_summary}`.toLowerCase();
  if (/jurisprudenc|sentencia|scj|sala/.test(haystack)) return "jurisprudencia";
  return "bibliografica";
}

export const CITATION_TIPO_META: Record<
  CitationTipo,
  { badge: string; tag: string; accent: string; text: string; bg: string; bd: string; ring: string }
> = {
  normativa: {
    badge: "Fuente normativa verificada",
    tag: "CAPA 1 · vinculante",
    accent: "var(--lr-gold)",
    text: "var(--lr-gold-text)",
    bg: "var(--lr-gold-bg)",
    bd: "var(--lr-gold-bd)",
    ring: "rgba(199,154,42,.35)",
  },
  jurisprudencia: {
    badge: "Criterio jurisprudencial",
    tag: "JURISPRUDENCIA · orientador",
    accent: "#2f8f63",
    text: "#237a52",
    bg: "rgba(47,143,99,.10)",
    bd: "rgba(47,143,99,.30)",
    ring: "rgba(47,143,99,.35)",
  },
  bibliografica: {
    badge: "Contexto bibliográfico",
    tag: "CAPA 2 · no vinculante",
    accent: "#5a6e88",
    text: "#5a6e88",
    bg: "rgba(90,110,136,.10)",
    bd: "rgba(90,110,136,.28)",
    ring: "rgba(90,110,136,.35)",
  },
};
