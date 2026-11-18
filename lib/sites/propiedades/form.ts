import { SLUG_RE } from "../paginas/form";
import type { I18nText, Listing, ListingCreate, ListingUpdate } from "../types";

/** Estado del formulario de propiedad y reglas puras (validacion, cuerpo de alta, parche). */
export interface Bi2 { es: string; en: string }
export interface Par { k: string; v: string }
export interface PForm {
  title: Bi2; desc: Bi2; slug: string; kind: "property" | "generic"; zone: string; building: string; dev: string;
  features: Bi2[]; featured: boolean; lat: string; lng: string; attrs: Par[]; media: string[];
}
export type PErr = "obligatorio" | "patron" | "geo" | "max"; export type PErrores = Record<string, PErr>;
export const MAX_FEATURES = 100, MAX_MEDIA = 60;

const vacio = (s: string) => s.trim() === "";
const bi = (t?: Partial<I18nText>): Bi2 => ({ es: t?.es ?? "", en: t?.en ?? "" });
const prim = (v: unknown) => ["string", "number", "boolean"].includes(typeof v);

export const nuevoForm = (): PForm => ({
  title: bi(), desc: bi(), slug: "", kind: "property", zone: "", building: "", dev: "", features: [], featured: false,
  lat: "", lng: "", attrs: [], media: [],
});

export function aForm(l: Listing): PForm {
  return {
    title: bi(l.title), desc: bi(l.description), slug: l.slug, kind: l.item_kind ?? "property", zone: l.zone_id ?? "",
    building: l.building_id ?? "", dev: l.development_id ?? "", features: (l.features ?? []).map(bi), featured: !!l.featured,
    lat: l.geo ? String(l.geo.lat) : "", lng: l.geo ? String(l.geo.lng) : "",
    attrs: Object.entries(l.vertical_attrs ?? {}).filter(([, v]) => prim(v)).map(([k, v]) => ({ k, v: String(v) })),
    media: [...(l.media ?? [])],
  };
}

const num = (s: string, lim: number) => (/^-?\d+(\.\d+)?$/.test(s.trim()) && Math.abs(Number(s)) <= lim ? Number(s) : null);

export function validar(f: PForm, o?: PForm): PErrores {
  const e: PErrores = {};
  if (vacio(f.title.es)) e["titulo-es"] = "obligatorio";
  if (vacio(f.desc.es) && (!vacio(f.desc.en) || (!!o && !vacio(o.desc.es)))) e["descripcion-es"] = "obligatorio";
  if (vacio(f.slug)) e.slug = "obligatorio";
  else if (!SLUG_RE.test(f.slug) || f.slug.length > 96) e.slug = "patron";
  if (!vacio(f.lat) || !vacio(f.lng)) {
    if (num(f.lat, 90) === null) e.lat = "geo";
    if (num(f.lng, 180) === null) e.lng = "geo";
  }
  if (f.features.length > MAX_FEATURES) e.caracteristicas = "max";
  f.features.forEach((x, i) => { if (vacio(x.es) && !vacio(x.en)) e[`caracteristica-${i}-es`] = "obligatorio"; });
  if (f.media.length > MAX_MEDIA) e.medios = "max";
  return e;
}

const texto = (b: Bi2): I18nText => (vacio(b.en) ? { es: b.es } : { es: b.es, en: b.en });
const feats = (f: PForm) => f.features.filter((x) => !vacio(x.es)).map(texto);
const attrs = (f: PForm, base: Record<string, unknown> = {}) => {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(base)) if (!prim(v)) out[k] = v; // lo no editable se conserva
  for (const p of f.attrs) if (!vacio(p.k)) out[p.k.trim()] = p.v;
  return out;
};
const geo = (f: PForm) => (vacio(f.lat) && vacio(f.lng) ? null : { lat: Number(f.lat), lng: Number(f.lng) });
const j = (x: unknown) => JSON.stringify(x);

/** Cuerpo de alta: solo campos con valor. Nunca tenant_id ni publish_state. */
export function paraCrear(f: PForm): ListingCreate {
  const b: ListingCreate = { slug: f.slug, title: texto(f.title), item_kind: f.kind, featured: f.featured, features: feats(f), media: f.media };
  if (!vacio(f.desc.es)) b.description = texto(f.desc);
  if (f.zone) b.zone_id = f.zone;
  if (f.building) b.building_id = f.building;
  if (f.dev) b.development_id = f.dev;
  const g = geo(f);
  if (g) b.geo = g;
  if (f.kind === "property" && f.attrs.some((p) => !vacio(p.k))) b.vertical_attrs = attrs(f);
  return b;
}

/** Parche (JSON Merge Patch): solo lo que cambio frente a la propiedad cargada. */
export function parche(f: PForm, l: Listing): ListingUpdate {
  const o = aForm(l);
  const p: ListingUpdate = {};
  if (j(f.title) !== j(o.title)) p.title = texto(f.title);
  if (j(f.desc) !== j(o.desc) && !vacio(f.desc.es)) p.description = texto(f.desc);
  if (f.slug !== o.slug) p.slug = f.slug;
  if (f.kind !== o.kind) p.item_kind = f.kind;
  if (f.zone !== o.zone) p.zone_id = f.zone || null;
  if (f.building !== o.building) p.building_id = f.building || null;
  if (f.dev !== o.dev) p.development_id = f.dev || null;
  if (f.featured !== o.featured) p.featured = f.featured;
  if (j(f.features) !== j(o.features)) p.features = feats(f);
  if (j(f.media) !== j(o.media)) p.media = f.media;
  if (f.lat !== o.lat || f.lng !== o.lng) p.geo = geo(f);
  if (f.kind === "property" && j(f.attrs) !== j(o.attrs)) p.vertical_attrs = attrs(f, l.vertical_attrs);
  else if (f.kind === "generic" && o.kind === "property" && o.attrs.length) p.vertical_attrs = {};
  return p;
}

export const sinIngles = (f: PForm) => [f.title, f.desc, ...f.features].filter((t) => !vacio(t.es) && vacio(t.en)).length;
export const aplicar = (l: Listing, p: ListingUpdate): Listing => ({ ...l, ...p }) as Listing;
