import type { PlanImportacion } from "./plan";
import { tituloDocumento } from "./plan";

export type Deps = {
  /** Expedientes que ya existen, por título exacto -> case_id (para no duplicar al repetir la importación). */
  existentes: () => Promise<Map<string, string>>;
  /** Títulos de los documentos que ya tiene un expediente. */
  documentosDe: (caseId: string) => Promise<Set<string>>;
  crearExpediente: (titulo: string, cliente: string) => Promise<string>;
  subir: (caseId: string, file: File, titulo: string) => Promise<void>;
};
export type Progreso = { hechos: number; total: number; actual: string };
export type Informe = {
  creados: number;
  reutilizados: number;
  subidos: number;
  yaEstaban: number;
  errores: { ruta: string; mensaje: string }[];
  detenido: null | "ESPACIO_AGOTADO" | "SIN_PERMISO";
  expedientes: { titulo: string; caseId: string }[];
};

const estado = (e: unknown) => (typeof (e as { status?: unknown })?.status === "number" ? (e as { status: number }).status : 0);
const mensaje = (e: unknown) => {
  const d = (e as { detail?: unknown })?.detail;
  if (d && typeof d === "object" && "mensaje" in d) return String((d as { mensaje: unknown }).mensaje);
  if (typeof d === "string" && d) return d;
  return e instanceof Error ? e.message : String(e);
};

/**
 * Sube el plan de uno en uno (el backend cifra y mide el espacio en cada documento). Se detiene si el archivo
 * se llena (402) o si no hay permiso (403); cualquier otro error se anota y sigue con el siguiente.
 */
export async function importar(plan: PlanImportacion, deps: Deps, onProgreso?: (p: Progreso) => void): Promise<Informe> {
  const inf: Informe = { creados: 0, reutilizados: 0, subidos: 0, yaEstaban: 0, errores: [], detenido: null, expedientes: [] };
  const total = plan.documentos;
  let hechos = 0;
  const existentes = await deps.existentes();
  for (const g of plan.grupos) {
    let caseId = existentes.get(g.titulo);
    let yaTiene = new Set<string>();
    try {
      if (caseId) {
        inf.reutilizados += 1;
        yaTiene = await deps.documentosDe(caseId);
      } else {
        caseId = await deps.crearExpediente(g.titulo, g.cliente);
        inf.creados += 1;
      }
    } catch (e) {
      if (estado(e) === 403) { inf.detenido = "SIN_PERMISO"; inf.errores.push({ ruta: g.titulo, mensaje: mensaje(e) }); return inf; }
      inf.errores.push({ ruta: g.titulo, mensaje: mensaje(e) });
      hechos += g.archivos.length;
      onProgreso?.({ hechos, total, actual: g.titulo });
      continue;
    }
    inf.expedientes.push({ titulo: g.titulo, caseId });
    for (const a of g.archivos) {
      const titulo = tituloDocumento(a.ruta);
      onProgreso?.({ hechos, total, actual: a.ruta });
      if (yaTiene.has(titulo)) {
        inf.yaEstaban += 1;
      } else {
        try {
          await deps.subir(caseId, a.file, titulo);
          inf.subidos += 1;
        } catch (e) {
          if (estado(e) === 402) { inf.detenido = "ESPACIO_AGOTADO"; inf.errores.push({ ruta: a.ruta, mensaje: mensaje(e) }); return inf; }
          if (estado(e) === 403) { inf.detenido = "SIN_PERMISO"; inf.errores.push({ ruta: a.ruta, mensaje: mensaje(e) }); return inf; }
          inf.errores.push({ ruta: a.ruta, mensaje: mensaje(e) });
        }
      }
      hechos += 1;
    }
    onProgreso?.({ hechos, total, actual: g.titulo });
  }
  return inf;
}
