import type { LegalCase } from "@/lib/legal/cases/case-types";
import type { ValidationQueueItem } from "@/lib/legal/validation-queue-api";

/** Plazo de un expediente tal como lo da GET /deadlines/upcoming (sin campos inventados). */
export type PlazoFuente = {
  case_id: string;
  effective_deadline_date: string;
  is_peremptory: boolean;
  overdue?: boolean;
  catalog_validated?: boolean | null;
};

export type ProximoPlazo = {
  fecha: string;
  perentorio: boolean;
  vencido: boolean;
  /** true = la regla está en el catálogo legal; false/null = por verificar. */
  verificado: boolean;
};

export type FilaTrabajo = {
  caso: LegalCase;
  /** null = el expediente no tiene plazos en el horizonte consultado (o no se pudieron cargar). */
  plazo: ProximoPlazo | null;
  /** Documentos en la cola de revisión del expediente; null = no se sabe (sin permiso o sin datos). */
  revisionesPendientes: number | null;
};

const CERRADOS = new Set(["CLOSED", "ARCHIVED"]);

/** El plazo más urgente de cada expediente: vencidos primero, luego la fecha más cercana. */
export function plazoMasUrgente(plazos: PlazoFuente[]): Map<string, ProximoPlazo> {
  const out = new Map<string, ProximoPlazo>();
  for (const p of plazos) {
    if (!p.case_id || !/^\d{4}-\d{2}-\d{2}/.test(p.effective_deadline_date || "")) continue;
    const nuevo: ProximoPlazo = {
      fecha: p.effective_deadline_date.slice(0, 10),
      perentorio: Boolean(p.is_peremptory),
      vencido: p.overdue === true,
      verificado: p.catalog_validated === true,
    };
    const prev = out.get(p.case_id);
    if (!prev || (nuevo.vencido && !prev.vencido) || (nuevo.vencido === prev.vencido && nuevo.fecha < prev.fecha)) {
      out.set(p.case_id, nuevo);
    }
  }
  return out;
}

/**
 * Filas del centro de trabajo: expedientes abiertos, los de plazo vencido o más cercano primero y luego los
 * actualizados más recientemente. `plazos` o `cola` en null = dato no disponible (se muestra «—», nunca 0).
 */
export function filasDeTrabajo(
  casos: LegalCase[],
  plazos: PlazoFuente[] | null,
  cola: ValidationQueueItem[] | null,
  opciones: { incluirCerrados?: boolean } = {},
): FilaTrabajo[] {
  const porCaso = plazos ? plazoMasUrgente(plazos) : new Map<string, ProximoPlazo>();
  const pendientes = new Map<string, number>();
  for (const i of cola ?? []) pendientes.set(i.case_id, (pendientes.get(i.case_id) ?? 0) + 1);

  return casos
    .filter((c) => opciones.incluirCerrados || !CERRADOS.has(c.state))
    .map((caso) => ({
      caso,
      plazo: porCaso.get(caso.case_id) ?? null,
      revisionesPendientes: cola ? (pendientes.get(caso.case_id) ?? 0) : null,
    }))
    .sort((a, b) => {
      if (a.plazo && b.plazo) {
        if (a.plazo.vencido !== b.plazo.vencido) return a.plazo.vencido ? -1 : 1;
        if (a.plazo.fecha !== b.plazo.fecha) return a.plazo.fecha < b.plazo.fecha ? -1 : 1;
      } else if (a.plazo || b.plazo) {
        return a.plazo ? -1 : 1;
      }
      return String(b.caso.updated_at).localeCompare(String(a.caso.updated_at));
    });
}

/** Dónde continuar: el plazo si hay uno vencido o próximo; si no, los documentos por revisar; si no, el expediente. */
export function rutaContinuar(f: FilaTrabajo): string {
  const id = encodeURIComponent(f.caso.case_id);
  if (f.plazo) return `/legal/cases/${id}/deadlines`;
  if (f.revisionesPendientes) return `/legal/cases/${id}/documents`;
  return `/legal/cases/${id}`;
}
