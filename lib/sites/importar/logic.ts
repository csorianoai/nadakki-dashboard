
export const FORMATO = "nadakki-portal-v1";
export const MAX_BYTES = 2 * 1024 * 1024;
export const RECURSOS = ["zones", "buildings", "developments", "listings"] as const;
export type Recurso = (typeof RECURSOS)[number];

export interface ErrorItem { external_ref: string | null; campo: string; codigo: string }
export interface ResumenRecurso { crear: number; actualizar: number; sin_cambios: number; errores: ErrorItem[] }
export type Informe = { dry_run: boolean } & Record<Recurso, ResumenRecurso>;
export type Portal = Record<string, unknown>;

export function hayErrores(i: Informe): boolean {
  return RECURSOS.some((r) => i[r].errores.length > 0);
}

const n = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && v >= 0 ? v : 0);

/** Normaliza el informe del servidor (200, o `report` dentro del 422): solo cifras y referencias, nunca contenido. */
export function leerInforme(raw: unknown): Informe | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  const out = { dry_run: o.dry_run !== false } as Informe;
  for (const r of RECURSOS) {
    const x = o[r];
    if (!x || typeof x !== "object") return null;
    const s = x as Record<string, unknown>;
    const errs = Array.isArray(s.errores) ? s.errores : [];
    out[r] = {
      crear: n(s.crear), actualizar: n(s.actualizar), sin_cambios: n(s.sin_cambios),
      errores: errs.filter((e) => e && typeof e === "object").map((e) => {
        const q = e as Record<string, unknown>;
        return {
          external_ref: typeof q.external_ref === "string" ? q.external_ref.slice(0, 80) : null,
          campo: typeof q.campo === "string" ? q.campo.slice(0, 80) : "",
          codigo: typeof q.codigo === "string" ? q.codigo.slice(0, 60) : "",
        };
      }),
    };
  }
  return out;
}

/** Informe DEMO generado del contrato: cuenta los items del archivo como "crear". No es un resultado del servidor. */
export function informeDemo(p: Portal): Informe {
  const out = { dry_run: true } as Informe;
  for (const r of RECURSOS) {
    const l = p[r];
    out[r] = { crear: Array.isArray(l) ? l.length : 0, actualizar: 0, sin_cambios: 0, errores: [] };
  }
  return out;
}

export type Lectura = { ok: true; portal: Portal } | { ok: false; error: "errTooBig" | "errJson" | "errFormat" | "errRead" };

function leerTexto(file: Blob): Promise<string> {
  return new Promise((res, rej) => {
    const fr = new FileReader();
    fr.onload = () => res(String(fr.result ?? ""));
    fr.onerror = () => rej(fr.error);
    fr.readAsText(file);
  });
}

/** Valida tamano, JSON y formato en el equipo: si falla, no se llama al servidor. */
export async function leerArchivo(file: File): Promise<Lectura> {
  if (file.size > MAX_BYTES) return { ok: false, error: "errTooBig" };
  let texto: string;
  try { texto = await leerTexto(file); } catch { return { ok: false, error: "errRead" }; }
  if (texto.length > MAX_BYTES) return { ok: false, error: "errTooBig" };
  let v: unknown;
  try { v = JSON.parse(texto); } catch { return { ok: false, error: "errJson" }; }
  if (!v || typeof v !== "object" || Array.isArray(v)) return { ok: false, error: "errJson" };
  if ((v as Portal).format !== FORMATO) return { ok: false, error: "errFormat" };
  return { ok: true, portal: v as Portal };
}

/** Clave de copy para un fallo del backend; sin detalle tecnico. */
export function claveError(e: unknown): string {
  const s = (e as { status?: number })?.status;
  return s === 401 || s === 403 || s === 404 || s === 413 || s === 422 || s === 503 ? `err${s}` : "errDefault";
}

