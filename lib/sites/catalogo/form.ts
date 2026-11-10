import { pick } from "../copy-util";
/** Desarrollos, zonas y edificios: campos de DevelopmentFields/ZoneFields/BuildingFields. Nunca tenant_id ni datos legales. */
export type Ent = "desarrollos" | "zonas" | "edificios";
export type Rec = Record<string, unknown>;
export type Kind = "text" | "area" | "date" | "zona";
export interface Spec { id: string; path: string; kind?: Kind; req?: boolean; re?: RegExp; mercado?: boolean }
export const ENTS: Ent[] = ["desarrollos", "zonas", "edificios"];

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DEC = /^[0-9]{1,18}(\.[0-9]{1,8})?$/;
const slug: Spec = { id: "slug", path: "slug", req: true, re: SLUG };
const fuente = (p: string, d: string): Spec[] => [{ id: "fuente", path: p }, { id: "fecha-fuente", path: d, kind: "date" }];

/** Orden = orden de tabulacion. `mercado`: si esta lleno, fuente y fecha del dato son obligatorias. */
export const SPEC: Record<Ent, Spec[]> = {
  desarrollos: [
    slug, { id: "nombre", path: "name", req: true }, { id: "descripcion-es", path: "description.es", kind: "area" }, { id: "descripcion-en", path: "description.en", kind: "area" },
    { id: "area", path: "area" }, { id: "zona", path: "zone_id", kind: "zona" }, { id: "tipo", path: "dev_type" }, { id: "estado", path: "status" },
    { id: "anio", path: "delivery_year", re: /^(19|2[01])[0-9]{2}$|^2200$/ }, { id: "precio-desde", path: "price_from", re: DEC },
    { id: "moneda", path: "currency", re: /^[A-Z]{3}$/ }, { id: "promotora", path: "developer" }, { id: "direccion", path: "address.line1" },
    { id: "ciudad", path: "address.city" }, { id: "pais", path: "address.country", re: /^[A-Z]{2}$/ },
  ],
  zonas: [
    slug, { id: "nombre-es", path: "name.es", req: true }, { id: "nombre-en", path: "name.en" }, { id: "intro-es", path: "lead.es", kind: "area" }, { id: "intro-en", path: "lead.en", kind: "area" },
    { id: "texto-es", path: "body.es", kind: "area" }, { id: "texto-en", path: "body.en", kind: "area" },
    { id: "precio-min", path: "price_range.min.amount", re: DEC, mercado: true }, { id: "precio-max", path: "price_range.max.amount", re: DEC, mercado: true },
    { id: "moneda", path: "price_range.currency", re: /^[A-Z]{3}$/ }, ...fuente("source", "source_date"),
  ],
  edificios: [
    slug, { id: "nombre", path: "name", req: true }, { id: "zona", path: "zone_id", kind: "zona" }, { id: "resumen-es", path: "summary.es", kind: "area" }, { id: "resumen-en", path: "summary.en", kind: "area" },
    { id: "cuota", path: "hoa.notes", kind: "area", mercado: true }, { id: "reglas", path: "rules.notes", kind: "area" }, { id: "estructura", path: "structural.notes", kind: "area", mercado: true },
    ...fuente("data_source", "data_date"),
  ],
};
export type F = Record<string, string>;
export const vacio = (e: Ent): F => Object.fromEntries(SPEC[e].map((s) => [s.id, ""]));

function fechaValida(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}
/** Errores por id de campo (vacio = enviable). Codigos: required | pattern | date | long. */
export function validar(e: Ent, f: F): Record<string, string> {
  const err: Record<string, string> = {};
  const val = (id: string) => (f[id] ?? "").trim();
  const conMercado = SPEC[e].some((s) => s.mercado && val(s.id));
  for (const s of SPEC[e]) {
    const v = val(s.id);
    const falta = s.req || (conMercado && (s.id === "fuente" || s.id === "fecha-fuente")) || (s.id === "moneda" && e === "zonas" && (val("precio-min") || val("precio-max")));
    if (!v) { if (falta) err[s.id] = "required"; continue; }
    if (v.length > 200 && s.kind !== "area") err[s.id] = "long";
    else if (s.re && !s.re.test(v)) err[s.id] = "pattern";
    else if (s.kind === "date" && !fechaValida(v)) err[s.id] = "date";
  }
  return err;
}
export function setPath(o: Rec, path: string, v: unknown): void {
  const k = path.split(".");
  let c = o;
  k.slice(0, -1).forEach((p) => { c = (c[p] ??= {}) as Rec; });
  c[k[k.length - 1]] = v;
}
export function getPath(o: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((c, p) => (c && typeof c === "object" ? (c as Rec)[p] : undefined), o);
}
/** Cuerpo del contrato (sin tenant_id): los vacios no se envian; 'en' vacio no se inventa. */
export function cuerpo(e: Ent, f: F): Rec {
  const b: Rec = {};
  for (const s of SPEC[e]) {
    const v = (f[s.id] ?? "").trim();
    if (v) setPath(b, s.path, s.id === "anio" ? Number(v) : v);
  }
  const pr = b.price_range as Rec | undefined;
  if (pr) {
    const cur = pr.currency;
    delete pr.currency;
    for (const k of ["min", "max"]) if (pr[k]) (pr[k] as Rec).currency = cur;
    if (!Object.keys(pr).length) delete b.price_range;
  }
  return b;
}
/** PATCH solo con lo que cambio respecto del formulario guardado. */
export function parche(e: Ent, f: F, base: F): Rec {
  const a = cuerpo(e, f), b = cuerpo(e, base);
  return Object.fromEntries(Object.entries(a).filter(([k, v]) => JSON.stringify(v) !== JSON.stringify(b[k])));
}
export function aForm(e: Ent, it: Rec): F {
  const f = vacio(e);
  for (const s of SPEC[e]) {
    const v = s.id === "moneda" && e === "zonas" ? (getPath(it, "price_range.min.currency") ?? getPath(it, "price_range.max.currency")) : getPath(it, s.path);
    if (v !== undefined && v !== null) f[s.id] = String(v);
  }
  return f;
}
/** Cuantos pares es/en tienen 'es' y no 'en' (aviso: se usara el texto en español). */
export const sinIngles = (e: Ent, f: F): number => SPEC[e].filter((s) => s.id.endsWith("-es") && f[s.id].trim() && !f[s.id.replace(/-es$/, "-en")]?.trim()).length;
/** authorized lo escribe solo staff: aqui solo se lee. */
export const verificado = (it: Rec | null): "si" | "no" | "pendiente" => (it?.authorized === true ? "si" : it?.authorized === false ? "pendiente" : "no");

/** Texto de un nombre del contrato (cadena o {es,en}). */
export const nombreDe = (v: unknown, lang: "es" | "en"): string =>
  typeof v === "string" ? v : v && typeof (v as { es?: unknown }).es === "string" ? pick(v as { es: string; en?: string }, lang) : "";
