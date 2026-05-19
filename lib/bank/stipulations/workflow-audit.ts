const AUDIT_KEY = "nadakki:audit:bank-stip-workflow:v1";
const AUDIT_LIMIT = 200;

export interface WorkflowAuditEvent {
  ts: string;
  tenant_key: string;
  application_id: string;
  action: string;
  detail?: Record<string, unknown>;
}

function truncate(arr: WorkflowAuditEvent[]): WorkflowAuditEvent[] {
  return arr.slice(-AUDIT_LIMIT);
}

function readAuditLog(): WorkflowAuditEvent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.sessionStorage.getItem(AUDIT_KEY);
    if (!raw?.trim()) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(Boolean) as WorkflowAuditEvent[];
  } catch {
    return [];
  }
}

function persistAudit(events: WorkflowAuditEvent[]): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(AUDIT_KEY, JSON.stringify(truncate(events)));
  } catch {
    /* ignore quota */
  }
}

export function tenantKeyForWorkflow(tenantId: string | undefined): string {
  const t = (tenantId ?? "").trim();
  return t || "__no_tenant__";
}

/** Client-side audit trail for stipulation workflow UX (META MVP parity until Agent-2 hardens events). */
export function emitWorkflowStipulationAudit(
  tenantId: string | undefined,
  applicationId: string,
  action: string,
  detail?: Record<string, unknown>,
): void {
  if (typeof window === "undefined") return;
  const ev: WorkflowAuditEvent = {
    ts: new Date().toISOString(),
    tenant_key: tenantKeyForWorkflow(tenantId),
    application_id: applicationId,
    action,
    detail,
  };
  persistAudit([...readAuditLog(), ev]);
}

/** Testing hook only */
export function __readWorkflowAuditForTests(): WorkflowAuditEvent[] {
  return readAuditLog();
}

/** Testing hook only */
export function __resetWorkflowAuditForTests(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(AUDIT_KEY);
  } catch {
    /* noop */
  }
}
