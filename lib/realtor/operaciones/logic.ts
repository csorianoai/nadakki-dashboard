import { STAGES, type OpFilters, type Operation, type StageId } from "./types";

export function applyFilters(list: readonly Operation[], f: OpFilters): Operation[] {
  return list.filter((o) => f.kind === "todas" || o.kind === f.kind);
}

/** Expedientes por etapa: solo cuentan las operaciones con etapa (la venta no tiene expediente). */
export function countByStage(list: readonly Operation[]): Record<StageId, number> {
  const out = Object.fromEntries(STAGES.map((s) => [s, 0])) as Record<StageId, number>;
  for (const o of list) if (o.stage) out[o.stage] += 1;
  return out;
}

export const inStage = (list: readonly Operation[], stage: StageId) => list.filter((o) => o.stage === stage);
export const opportunities = (list: readonly Operation[]) => list.filter((o) => o.stage === null);
