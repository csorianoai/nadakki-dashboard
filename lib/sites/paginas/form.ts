import type { Block, I18nText, Page, PageUpdate } from "../types";

/** Estado del formulario del editor y reglas puras (validacion, parche, avisos). */
export interface Bi2 { es: string; en: string }
export interface Form { title: Bi2; meta: Bi2; slug: Bi2; blocks: Record<string, Bi2> }
export interface TextoBloque { id: string; blockId: string; key: string }
export type Errores = Record<string, "obligatorio" | "patron">;

export const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
export const esLegal = (b: Block) => b.type.startsWith("legal_");

const bi = (t?: Partial<I18nText>): Bi2 => ({ es: t?.es ?? "", en: t?.en ?? "" });
const esTexto = (v: unknown): v is I18nText => !!v && typeof v === "object" && typeof (v as I18nText).es === "string";

/** Textos editables: entradas i18n con forma {es,en} de bloques que no son legal_. El resto se reenvia intacto. */
export function textosBloque(page: Page): TextoBloque[] {
  const out: TextoBloque[] = [];
  for (const b of page.body ?? []) {
    if (esLegal(b)) continue;
    for (const [key, v] of Object.entries(b.i18n ?? {})) if (esTexto(v)) out.push({ id: `${b.block_id}-${key}`, blockId: b.block_id, key });
  }
  return out;
}

export function aForm(page: Page): Form {
  const blocks: Form["blocks"] = {};
  for (const t of textosBloque(page)) blocks[t.id] = bi(page.body?.find((b) => b.block_id === t.blockId)?.i18n?.[t.key] as I18nText);
  return { title: bi(page.title), meta: bi(page.meta_description), slug: bi(page.slug), blocks };
}

const vacio = (s: string) => s.trim() === "";
// ES obligatorio si el texto ya existia o si se escribio algo en ingles.
const faltaEs = (n: Bi2, o?: Bi2) => vacio(n.es) && (!vacio(n.en) || (!!o && !vacio(o.es)));

export function validar(f: Form, page: Page): Errores {
  const e: Errores = {};
  const o = aForm(page);
  if (vacio(f.title.es)) e["titulo-es"] = "obligatorio";
  if (faltaEs(f.meta, o.meta)) e["meta-es"] = "obligatorio";
  if (vacio(f.slug.es)) e["slug-es"] = "obligatorio";
  else if (!SLUG_RE.test(f.slug.es) || f.slug.es.length > 96) e["slug-es"] = "patron";
  if (!vacio(f.slug.en) && (!SLUG_RE.test(f.slug.en) || f.slug.en.length > 96)) e["slug-en"] = "patron";
  for (const [id, v] of Object.entries(f.blocks)) if (faltaEs(v, o.blocks[id])) e[`${id}-es`] = "obligatorio";
  return e;
}

const texto = (b: Bi2, base?: object): I18nText => {
  const t = { ...(base as I18nText | undefined), es: b.es } as I18nText;
  if (vacio(b.en)) delete t.en; else t.en = b.en;
  return t;
};
const igual = (a: Bi2, b: Bi2) => a.es === b.es && a.en === b.en;

/** Parche (JSON Merge Patch): solo los campos que cambiaron. Nunca incluye tenant_id. */
export function parche(f: Form, page: Page): PageUpdate {
  const o = aForm(page);
  const p: PageUpdate = {};
  if (!igual(f.title, o.title)) p.title = texto(f.title);
  if (!igual(f.meta, o.meta)) p.meta_description = texto(f.meta);
  if (!igual(f.slug, o.slug)) {
    const s: Record<string, string> = { es: f.slug.es };
    if (!vacio(f.slug.en)) s.en = f.slug.en;
    p.slug = s;
  }
  const ids = Object.keys(f.blocks).filter((id) => !igual(f.blocks[id], o.blocks[id]));
  if (ids.length) {
    const editables = textosBloque(page);
    p.body = (page.body ?? []).map((b) => {
      const mios = editables.filter((t) => t.blockId === b.block_id && ids.includes(t.id));
      if (!mios.length) return b;
      const i18n = { ...b.i18n };
      for (const t of mios) i18n[t.key] = texto(f.blocks[t.id], i18n[t.key] as object);
      return { ...b, i18n };
    });
  }
  return p;
}

/** Cuantos textos tienen espanol pero no ingles (se mostraran en espanol). */
export function sinIngles(f: Form): number {
  return [f.title, f.meta, ...Object.values(f.blocks)].filter((t) => !vacio(t.es) && vacio(t.en)).length;
}

export const aplicar = (page: Page, p: PageUpdate): Page => ({ ...page, ...p });
