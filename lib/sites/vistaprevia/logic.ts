import type { Lang } from "../copy-util";
import type { Block, Listing, MediaAsset, Page } from "../types";

export interface PreviewText { text: string; fallback: boolean }
export type PreviewBlock =
  | { kind: "legal"; id: string }
  | { kind: "content"; id: string; type: string; texts: PreviewText[]; images: string[] };
export interface PreviewPage { title: PreviewText; blocks: PreviewBlock[] }
export interface PreviewListing { id: string; title: PreviewText; description: PreviewText | null; images: string[] }

const esBi = (v: unknown): v is { es: string; en?: string } => !!v && typeof v === "object" && typeof (v as { es?: unknown }).es === "string";

/** Texto en el idioma elegido; si falta, respalda a ES y lo marca. Nunca HTML: el resultado se pinta como texto. */
export function textIn(v: unknown, lang: Lang): PreviewText {
  if (!esBi(v)) return { text: "", fallback: false };
  if (lang === "en") {
    if (typeof v.en === "string" && v.en.trim() !== "") return { text: v.en, fallback: false };
    return { text: v.es, fallback: true };
  }
  return { text: v.es, fallback: false };
}

/** Altas de imagen: solo medios aprobados; el resto se omite sin dejar rastro. */
export function approvedAlts(media: MediaAsset[], lang: Lang): Map<string, string> {
  const m = new Map<string, string>();
  for (const a of media) if (a.status === "approved") m.set(a.id, textIn(a.alt, lang).text);
  return m;
}

const imageIds = (data: unknown): string[] => {
  const d = (data ?? {}) as Record<string, unknown>;
  const ids = [d.media_id, ...(Array.isArray(d.media) ? d.media : [])];
  return ids.filter((x): x is string => typeof x === "string");
};

export function buildBlock(b: Block, lang: Lang, alts: Map<string, string>): PreviewBlock {
  if (b.type.startsWith("legal_")) return { kind: "legal", id: b.block_id }; // el contenido legal no se muestra ni se edita aqui
  const texts = Object.values(b.i18n ?? {}).map((v) => textIn(v, lang)).filter((t) => t.text !== "");
  const images = imageIds(b.data).flatMap((id) => (alts.has(id) ? [alts.get(id) as string] : []));
  return { kind: "content", id: b.block_id, type: b.type, texts, images };
}

export function buildPage(p: Page, lang: Lang, alts: Map<string, string>): PreviewPage {
  return { title: textIn(p.title, lang), blocks: (p.body ?? []).map((b) => buildBlock(b, lang, alts)) };
}

export function buildListing(l: Listing, lang: Lang, alts: Map<string, string>): PreviewListing {
  const d = textIn(l.description, lang);
  return {
    id: l.id,
    title: textIn(l.title, lang),
    description: d.text ? d : null,
    images: (l.media ?? []).flatMap((id) => (alts.has(id) ? [alts.get(id) as string] : [])),
  };
}
