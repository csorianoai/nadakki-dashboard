import type { BankWorkflowStipulation } from "./workflow-types";
import { tenantKeyForWorkflow } from "./workflow-audit";

/** Local overlay / optimistic rows keyed by tenant + application (META: tenant isolation). */
export interface StipulationWorkflowSessionSnapshot {
  localRows: BankWorkflowStipulation[];
  overrideById: Record<string, Partial<BankWorkflowStipulation>>;
  version: 1;
}

const PREFIX = "nadakki:stip-workflow-session:v1";

function key(tenantId: string | undefined, applicationId: string): string {
  return `${PREFIX}:${tenantKeyForWorkflow(tenantId)}:${applicationId.trim()}`;
}

export function readStipulationWorkflowSession(
  tenantId: string | undefined,
  applicationId: string | undefined,
): StipulationWorkflowSessionSnapshot | null {
  if (!applicationId?.trim() || typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(key(tenantId, applicationId.trim()));
    if (!raw?.trim()) return null;
    const parsed = JSON.parse(raw) as StipulationWorkflowSessionSnapshot;
    if (!parsed || typeof parsed !== "object") return null;
    if (parsed.version !== 1) return null;
    if (!Array.isArray(parsed.localRows)) return null;
    if (!parsed.overrideById || typeof parsed.overrideById !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStipulationWorkflowSession(
  tenantId: string | undefined,
  applicationId: string,
  snapshot: StipulationWorkflowSessionSnapshot,
): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(key(tenantId, applicationId), JSON.stringify(snapshot));
  } catch {
    /* quota / private mode */
  }
}
