import type { MediaAsset, MediaCreate, MediaUpdate, PermissionType } from "../types";

export const MAX_BYTES = 26214400;
export const MIMES = ["image/jpeg", "image/png", "image/webp", "image/avif"] as const;
export const TIPOS: PermissionType[] = ["own", "developer", "owner", "stock"];
export interface MForm {
  altEs: string; altEn: string; source: string; license: string; ptype: string; grantedBy: string;
  scope: string; pdate: string; acquired: string; evidence: string;
}
/** Campo del formulario -> id del control (data-testid). Orden = orden de tabulacion y de foco. */
export const IDS: Record<string, keyof MForm | "file"> = {
  archivo: "file", "alt-es": "altEs", "alt-en": "altEn", fuente: "source", licencia: "license", "tipo-permiso": "ptype",
  "otorgado-por": "grantedBy", alcance: "scope", "fecha-permiso": "pdate", "fecha-adquisicion": "acquired", evidencia: "evidence",
};
export const vacio = (): MForm => ({ altEs: "", altEn: "", source: "", license: "", ptype: "", grantedBy: "", scope: "", pdate: "", acquired: "", evidence: "" });
/** Fecha de hoy (local) como AAAA-MM-DD. */
export function hoy(d = new Date()): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function fechaValida(s: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return d.getUTCFullYear() === +m[1] && d.getUTCMonth() === +m[2] - 1 && d.getUTCDate() === +m[3];
}
/** Errores por id de control (vacio = enviable). Codigos: required | invalid | future | long | type | size. */
export function validar(f: MForm, file: { type: string; size: number } | null | undefined, necesitaArchivo: boolean, hoyStr = hoy()): Record<string, string> {
  const e: Record<string, string> = {};
  if (necesitaArchivo) {
    if (!file) e.archivo = "required";
    else if (!(MIMES as readonly string[]).includes(file.type)) e.archivo = "type";
    else if (file.size < 1 || file.size > MAX_BYTES) e.archivo = "size";
  }
  const req = (id: string, v: string, max = 200) => { if (!v.trim()) e[id] = "required"; else if (v.trim().length > max) e[id] = "long"; };
  req("alt-es", f.altEs); req("fuente", f.source); req("licencia", f.license);
  if (!TIPOS.includes(f.ptype as PermissionType)) e["tipo-permiso"] = "required";
  req("otorgado-por", f.grantedBy); req("alcance", f.scope);
  if (f.altEn.trim().length > 200) e["alt-en"] = "long";
  const fecha = (id: string, v: string, noFutura: boolean) => {
    if (!v) e[id] = "required"; else if (!fechaValida(v)) e[id] = "invalid"; else if (noFutura && v > hoyStr) e[id] = "future";
  };
  fecha("fecha-permiso", f.pdate, true); fecha("fecha-adquisicion", f.acquired, false);
  if (f.ptype === "developer" || f.ptype === "owner") req("evidencia", f.evidence, 500);
  return e;
}
/** Cuerpo comun (sin upload_id). alt.en vacio = se usa el texto en español (el contrato exige ambos). */
function campos(f: MForm): MediaUpdate {
  const b: MediaUpdate = {
    alt: { es: f.altEs.trim(), en: f.altEn.trim() || f.altEs.trim() }, source: f.source.trim(), license: f.license.trim(),
    permission_type: f.ptype as PermissionType, permission_granted_by: f.grantedBy.trim(), permission_scope: f.scope.trim(),
    permission_date: f.pdate, acquired_on: f.acquired,
  };
  if (f.ptype === "developer" || f.ptype === "owner") b.permission_evidence = f.evidence.trim();
  return b;
}
export const paraCrear = (f: MForm, uploadId: string): MediaCreate => ({ upload_id: uploadId, ...campos(f) }) as MediaCreate;
/** Cuerpo de edicion de metadatos (sin upload_id). */
export const paraActualizar = (f: MForm): MediaUpdate => campos(f);
/** Formulario de edicion precargado desde el medio guardado. */
export function desdeMedio(m: MediaAsset): MForm {
  const s = (k: string) => (typeof m[k] === "string" ? (m[k] as string) : "");
  return {
    altEs: m.alt?.es ?? "", altEn: m.alt?.en === m.alt?.es ? "" : (m.alt?.en ?? ""), source: s("source"), license: s("license"), ptype: m.permission_type,
    grantedBy: s("permission_granted_by"), scope: s("permission_scope"), pdate: m.permission_date, acquired: m.acquired_on, evidence: s("permission_evidence"),
  };
}
export async function sha256Hex(file: Blob): Promise<string> {
  const buf = await (file as { arrayBuffer: () => Promise<ArrayBuffer> }).arrayBuffer();
  const h = await globalThis.crypto.subtle.digest("SHA-256", new Uint8Array(buf));
  return Array.from(new Uint8Array(h), (b) => b.toString(16).padStart(2, "0")).join("");
}