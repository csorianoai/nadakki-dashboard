"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { getStipulations, notifyDealerStipulationWorkflow } from "@/lib/api/stipulations";
import type { StipulationsApiRole } from "@/lib/api/stipulations-types";
import type { BankApplicationStipulation } from "@/lib/bank-application-detail/types";
import {
  creditStipulationToWorkflowRow,
  isLegalWorkflowStatusTransition,
  stipulationDetailToWorkflowRow,
} from "@/lib/bank/stipulations/workflow-mappers";
import { emitWorkflowStipulationAudit } from "@/lib/bank/stipulations/workflow-audit";
import type { BankWorkflowStipulation } from "@/lib/bank/stipulations/workflow-types";
import type { StipulationWorkflowSessionSnapshot } from "@/lib/bank/stipulations/workflow-storage";
import { readStipulationWorkflowSession, writeStipulationWorkflowSession } from "@/lib/bank/stipulations/workflow-storage";
import type { WorkflowStipulationTemplate } from "@/lib/bank/stipulations/workflow-templates";
import { deadlineIsValidFuture } from "@/lib/bank/stipulations/workflow-validation";
import { resolveStipulationsApiRoleFromStorage } from "@/lib/bank/stipulations/resolve-role";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

const emptySnap = (): StipulationWorkflowSessionSnapshot => ({
  version: 1,
  localRows: [],
  overrideById: {},
});

function applySnapshotToBase(
  remoteRows: BankWorkflowStipulation[],
  snap: StipulationWorkflowSessionSnapshot,
): BankWorkflowStipulation[] {
  const byId = new Map(remoteRows.map((r) => [r.id, { ...r }]));
  for (const [id, patch] of Object.entries(snap.overrideById ?? {})) {
    const row = byId.get(id);
    if (row) byId.set(id, { ...row, ...patch });
  }
  const out = Array.from(byId.values());
  for (const local of snap.localRows) {
    if (!byId.has(local.id)) out.push(local);
  }
  return out;
}

function uniqLocalId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return `local-${crypto.randomUUID()}`;
  return `local-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function buildMarkedSentSnapshot(
  snap: StipulationWorkflowSessionSnapshot,
  visibleItems: BankWorkflowStipulation[],
  reconciledRemote: BankWorkflowStipulation[],
): StipulationWorkflowSessionSnapshot {
  const nextOverrides: Record<string, Partial<BankWorkflowStipulation>> = { ...snap.overrideById };
  const nextLocals = snap.localRows.map((r) => ({ ...r }));
  const stamp = new Date().toISOString();

  const markSent = (row: BankWorkflowStipulation) =>
    row.status === "completed" || row.status === "rejected" ? row : { ...row, status: "sent" as const, updated_at: stamp };

  visibleItems.forEach((row) => {
    if (row.id.startsWith("local-")) {
      const ix = nextLocals.findIndex((l) => l.id === row.id);
      if (ix >= 0) nextLocals[ix] = markSent(nextLocals[ix]!);
      return;
    }
    const cur = reconciledRemote.find((x) => x.id === row.id);
    if (!cur) return;
    nextOverrides[row.id] = markSent({ ...cur, ...(nextOverrides[row.id] ?? {}) });
  });

  return { ...snap, version: 1, overrideById: nextOverrides, localRows: nextLocals };
}

export interface UseBankStipulationsWorkflowOptions {
  applicationId: string | undefined;
  tenantId: string | undefined;
  enabled: boolean;
  detailSeeds?: BankApplicationStipulation[] | undefined;
}

export interface UseBankStipulationsWorkflowResult {
  items: BankWorkflowStipulation[];
  isLoading: boolean;
  hasOfflineQueuedChanges: boolean;
  liveRegionMessage: string;
  role: StipulationsApiRole;
  refresh: () => Promise<void>;

  bulkMarkAllSent: () => void;
  bulkResetToPending: () => void;

  addFromTemplate: (template: WorkflowStipulationTemplate, assignee?: BankWorkflowStipulation["assigned_to"]) => void;

  addCustomStipulation: (input: {
    description: string;
    assigned_to: BankWorkflowStipulation["assigned_to"];
    deadline?: string;
  }) => string | null;

  updateRow: (
    next: BankWorkflowStipulation,
    attachmentUrl?: string,
  ) =>
    | { ok: true }
    | { ok: false; reason: "illegal_transition" | "invalid_deadline" };

  persistLocalSnapshot: () => void;

  sendToDealer: () => Promise<
    | { ok: true }
    | { ok: false; reason: "no_application" | "notify_failed"; unsupported?: boolean }
  >;
}

export function useBankStipulationsWorkflow(
  opts: UseBankStipulationsWorkflowOptions,
): UseBankStipulationsWorkflowResult {
  const { applicationId, tenantId, enabled, detailSeeds } = opts;
  const online = useOnlineStatus();
  const role = resolveStipulationsApiRoleFromStorage();
  const app = applicationId?.trim() ?? "";

  const [sessionSnapshot, setSessionSnapshot] = useState<StipulationWorkflowSessionSnapshot>(() => emptySnap());
  const [liveRegionMessage, setLiveRegionMessage] = useState("");

  const key = enabled && app ? (["workflow-stipulation", app, role] as const) : null;

  const { data: remote, isLoading: remoteLoading, mutate } = useSWR(
    key,
    async ([, id, r]) => getStipulations(id, r),
    {
      revalidateOnFocus: true,
      refreshInterval: 30_000,
      dedupingInterval: 2000,
    },
  );

  useEffect(() => {
    const snap = app && enabled ? readStipulationWorkflowSession(tenantId, app) : null;
    setSessionSnapshot(snap ?? emptySnap());
  }, [app, tenantId, enabled]);

  const persistSnapshotState = useCallback(
    (next: StipulationWorkflowSessionSnapshot, announce?: string) => {
      setSessionSnapshot(next);
      if (app) writeStipulationWorkflowSession(tenantId, app, next);
      if (announce?.trim()) setLiveRegionMessage(announce.trim());
    },
    [app, tenantId],
  );

  const baseRemoteRows = useMemo(() => (remote ?? []).map(creditStipulationToWorkflowRow), [remote]);

  const seededRows = useMemo(() => {
    if (!detailSeeds?.length) return [];
    return detailSeeds.map((row, idx) => stipulationDetailToWorkflowRow(row, idx));
  }, [detailSeeds]);

  const reconciledRemote = useMemo(() => {
    if (baseRemoteRows.length) return baseRemoteRows;
    return seededRows;
  }, [baseRemoteRows, seededRows]);

  const items = useMemo(
    () => applySnapshotToBase(reconciledRemote, sessionSnapshot),
    [reconciledRemote, sessionSnapshot],
  );

  const hasQueuedOverlay =
    sessionSnapshot.localRows.length > 0 || Object.keys(sessionSnapshot.overrideById ?? {}).length > 0;

  const hasOfflineQueuedChanges = !online && hasQueuedOverlay;

  const refresh = useCallback(async () => {
    await mutate();
  }, [mutate]);

  const bulkMarkAllSent = useCallback(() => {
    if (!app) return;
    const nextSnap = buildMarkedSentSnapshot(sessionSnapshot, items, reconciledRemote);
    persistSnapshotState(nextSnap, "Acción masiva: marcadas como enviadas donde aplica.");
    emitWorkflowStipulationAudit(tenantId, app, "bulk_mark_sent", {});
  }, [app, items, persistSnapshotState, reconciledRemote, sessionSnapshot, tenantId]);

  const bulkResetToPending = useCallback(() => {
    if (!app) return;
    const nextOverrides: Record<string, Partial<BankWorkflowStipulation>> = { ...sessionSnapshot.overrideById };
    const stamp = new Date().toISOString();
    items.forEach((row) => {
      if (row.status === "completed" || row.status === "rejected") return;
      if (row.id.startsWith("local-")) return;
      const cur = reconciledRemote.find((x) => x.id === row.id);
      if (!cur) return;
      nextOverrides[row.id] = { ...(nextOverrides[row.id] ?? {}), status: "pending", updated_at: stamp };
    });
    const nextLocals = sessionSnapshot.localRows.map((r) =>
      r.status === "completed" || r.status === "rejected"
        ? r
        : { ...r, status: "pending" as const, updated_at: stamp },
    );

    persistSnapshotState(
      { ...sessionSnapshot, overrideById: nextOverrides, localRows: nextLocals },
      "Acción masiva: pendientes aplicadas donde aplica.",
    );
    emitWorkflowStipulationAudit(tenantId, app, "bulk_reset_pending", {});
  }, [app, items, persistSnapshotState, reconciledRemote, sessionSnapshot, tenantId]);

  const addFromTemplate = useCallback(
    (template: WorkflowStipulationTemplate, assignee: BankWorkflowStipulation["assigned_to"] = "dealer") => {
      if (!app) return;
      const now = new Date().toISOString();
      const row: BankWorkflowStipulation = {
        id: uniqLocalId(),
        description: template.label,
        assigned_to: assignee,
        status: "pending",
        documents_uploaded: [],
        updated_at: now,
        template_id: template.id,
      };
      persistSnapshotState(
        { ...sessionSnapshot, localRows: [...sessionSnapshot.localRows, row] },
        `Plantilla aplicada: ${template.label}`,
      );
      emitWorkflowStipulationAudit(tenantId, app, "template_add", {
        template_id: template.id,
      });
      if (!online)
        emitWorkflowStipulationAudit(tenantId, app, "offline_pending_change", { kind: "template_add", id: row.id });
    },
    [app, online, persistSnapshotState, sessionSnapshot, tenantId],
  );

  const addCustomStipulation = useCallback(
    (input: {
      description: string;
      assigned_to: BankWorkflowStipulation["assigned_to"];
      deadline?: string;
    }) => {
      const d = input.description.trim();
      if (!d) return "La descripción es obligatoria.";
      if (!deadlineIsValidFuture(input.deadline, Date.now())) return "La fecha límite debe ser válida y futura.";
      if (!app) return "Sin expediente válido.";
      const now = new Date().toISOString();
      const row: BankWorkflowStipulation = {
        id: uniqLocalId(),
        description: d,
        assigned_to: input.assigned_to,
        deadline: input.deadline?.trim() || undefined,
        status: "pending",
        documents_uploaded: [],
        updated_at: now,
      };
      persistSnapshotState(
        { ...sessionSnapshot, localRows: [...sessionSnapshot.localRows, row] },
        "Estipulación manual agregada.",
      );
      emitWorkflowStipulationAudit(tenantId, app, "custom_add", { length: row.description.length });
      if (!online)
        emitWorkflowStipulationAudit(tenantId, app, "offline_pending_change", { kind: "custom_add", id: row.id });
      return null;
    },
    [app, persistSnapshotState, sessionSnapshot, tenantId],
  );

  const updateRow = useCallback(
    (next: BankWorkflowStipulation, attachmentUrl?: string) => {
      if (!deadlineIsValidFuture(next.deadline, Date.now())) {
        return { ok: false, reason: "invalid_deadline" } as const;
      }
      const original = items.find((i) => i.id === next.id);
      if (original && !isLegalWorkflowStatusTransition(original.status, next.status)) {
        return { ok: false, reason: "illegal_transition" } as const;
      }

      let snap: StipulationWorkflowSessionSnapshot = { ...sessionSnapshot };
      if (next.id.startsWith("local-")) {
        snap.localRows = snap.localRows.map((l) => (l.id === next.id ? { ...next } : l));
      } else {
        snap.overrideById = {
          ...snap.overrideById,
          [next.id]: {
            ...(snap.overrideById[next.id] ?? {}),
            ...next,
          },
        };
      }

      if (attachmentUrl?.trim()) {
        const url = attachmentUrl.trim();
        if (next.id.startsWith("local-")) {
          snap.localRows = snap.localRows.map((l) => {
            if (l.id !== next.id) return l;
            return {
              ...l,
              documents_uploaded: [...(l.documents_uploaded ?? []), url],
              updated_at: new Date().toISOString(),
            };
          });
        } else {
          const prevMerged = snap.overrideById[next.id]?.documents_uploaded ?? next.documents_uploaded;
          snap.overrideById[next.id] = {
            ...(snap.overrideById[next.id] ?? {}),
            documents_uploaded: [...(prevMerged ?? []), url],
            updated_at: new Date().toISOString(),
          };
        }
        emitWorkflowStipulationAudit(tenantId, app, "document_attach_simulated", { stipulation_id: next.id });
      }

      persistSnapshotState(snap, `Estipulación actualizada (${next.status}).`);
      emitWorkflowStipulationAudit(tenantId, app, "field_change", { stipulation_id: next.id, status: next.status });
      if (!online) emitWorkflowStipulationAudit(tenantId, app, "offline_pending_change", { stipulation_id: next.id });

      return { ok: true as const };
    },
    [app, items, online, persistSnapshotState, sessionSnapshot, tenantId],
  );

  const persistLocalSnapshot = useCallback(() => {
    persistSnapshotState(sessionSnapshot, "");
  }, [persistSnapshotState, sessionSnapshot]);

  const sendToDealer = useCallback(async () => {
    if (!app) return { ok: false as const, reason: "no_application" as const };
    const ids = items.map((i) => i.id);
    emitWorkflowStipulationAudit(tenantId, app, "dealer_notification_attempt", {
      stipulation_ids: ids,
      online,
    });

    try {
      const result = await notifyDealerStipulationWorkflow(app, ids, role);
      emitWorkflowStipulationAudit(tenantId, app, "dealer_notification_result", result);
      if (!result.ok)
        return { ok: false as const, reason: "notify_failed" as const, unsupported: result.unsupported };

      const nextSnap = buildMarkedSentSnapshot(sessionSnapshot, items, reconciledRemote);
      persistSnapshotState(nextSnap, "Flujo marcado como enviado al concesionario.");

      return { ok: true as const };
    } catch {
      emitWorkflowStipulationAudit(tenantId, app, "dealer_notification_error", {});
      return { ok: false as const, reason: "notify_failed" as const };
    }
  }, [app, items, online, persistSnapshotState, reconciledRemote, role, sessionSnapshot, tenantId]);

  return {
    items,
    isLoading: Boolean(key && remoteLoading && remote === undefined),
    hasOfflineQueuedChanges,
    liveRegionMessage,
    role,
    refresh,
    bulkMarkAllSent,
    bulkResetToPending,
    addFromTemplate,
    addCustomStipulation,
    updateRow,
    persistLocalSnapshot,
    sendToDealer,
  };
}
