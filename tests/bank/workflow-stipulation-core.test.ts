/**
 * Consolidated unit coverage for bank stipulation workflow utilities (META T6.3 polish).
 */

import type { CreditStipulation } from "@/lib/api/stipulations-types";
import {
  creditStipulationToWorkflowRow,
  isLegalWorkflowStatusTransition,
  normalizeWorkflowStatusFromString,
} from "@/lib/bank/stipulations/workflow-mappers";
import { deadlineIsValidFuture } from "@/lib/bank/stipulations/workflow-validation";
import {
  emitWorkflowStipulationAudit,
  tenantKeyForWorkflow,
  __readWorkflowAuditForTests,
  __resetWorkflowAuditForTests,
} from "@/lib/bank/stipulations/workflow-audit";
import { writeStipulationWorkflowSession, readStipulationWorkflowSession } from "@/lib/bank/stipulations/workflow-storage";

describe("workflow mappers / validation", () => {
  test("pending may transition to sent", () => {
    expect(isLegalWorkflowStatusTransition("pending", "sent")).toBe(true);
  });

  test("completed locks further transitions except itself", () => {
    expect(isLegalWorkflowStatusTransition("completed", "completed")).toBe(true);
    expect(isLegalWorkflowStatusTransition("completed", "pending")).toBe(false);
  });

  test("rejected may rollback to remediation states", () => {
    expect(isLegalWorkflowStatusTransition("rejected", "pending")).toBe(true);
  });

  test("normalizeUploadedStatus", () => {
    expect(normalizeWorkflowStatusFromString("Uploaded")).toBe("in_progress");
  });

  test("creditStipulationRejectedMaps", () => {
    const cs: CreditStipulation = {
      id: "s1",
      description: "X",
      status: "rejected",
    };
    const row = creditStipulationToWorkflowRow(cs);
    expect(row.status).toBe("rejected");
    expect(row.assigned_to).toBe("dealer");
  });

  test("deadlineAllowsEmpty", () => {
    expect(deadlineIsValidFuture(undefined, Date.now())).toBe(true);
  });

  test("deadlineRejectsMalformed", () => {
    expect(deadlineIsValidFuture("not-a-date", Date.now())).toBe(false);
  });

  test("deadlineRequiresFutureVsReferenceNow", () => {
    const ref = Date.now();
    expect(deadlineIsValidFuture(new Date(ref + 86400000).toISOString(), ref)).toBe(true);
    expect(deadlineIsValidFuture(new Date(ref - 86400000).toISOString(), ref)).toBe(false);
  });
});

describe("workflow audit isolation", () => {
  beforeEach(() => {
    __resetWorkflowAuditForTests();
  });

  test("emitWorkflowStipulationAudit appends normalized tenant markers", () => {
    emitWorkflowStipulationAudit("tenant-a", "app-77", "test-event", { x: 1 });
    expect(tenantKeyForWorkflow("tenant-a")).toBe("tenant-a");
    const log = __readWorkflowAuditForTests();
    expect(log.some((l) => l.action === "test-event")).toBe(true);
    expect(log.some((l) => l.tenant_key === "tenant-a")).toBe(true);
  });

  test("emitWorkflowStipulationAudit maps missing tenant slug", () => {
    emitWorkflowStipulationAudit(undefined, "app-2", "no-tenant", {});
    const log = __readWorkflowAuditForTests();
    expect(log.some((l) => l.tenant_key === "__no_tenant__")).toBe(true);
  });
});

describe("workflow storage tenant isolation keys", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  test("readStipulationWorkflowSession returns null for unknown stacks", () => {
    expect(readStipulationWorkflowSession("t1", "missing")).toBeNull();
  });

  test("write/read roundtrip respects tenant segregation", () => {
    writeStipulationWorkflowSession("tenant-1", "app-z", {
      version: 1,
      localRows: [],
      overrideById: { a: { status: "sent" as const } },
    });
    const other = readStipulationWorkflowSession("tenant-9", "app-z");
    const mine = readStipulationWorkflowSession("tenant-1", "app-z");
    expect(other).toBeNull();
    expect(mine?.overrideById.a?.status).toBe("sent");
  });
});
