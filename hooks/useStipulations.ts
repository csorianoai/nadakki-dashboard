"use client";

import { useCallback } from "react";
import useSWR from "swr";
import type {
  CreditStipulation,
  StipulationCreatePayload,
  StipulationsApiRole,
} from "@/lib/api/stipulations-types";
import {
  createStipulation,
  getStipulations,
  notifyDealerStipulationWorkflow,
  postStipulationUploadLink,
  rejectStipulation,
  verifyStipulation,
} from "@/lib/api/stipulations";
import { emitWorkflowStipulationAudit } from "@/lib/bank/stipulations/workflow-audit";
import { canMutateStipulations, resolveStipulationsApiRoleFromStorage } from "@/lib/bank/stipulations/resolve-role";

export interface UseStipulationsResult {
  stipulations: CreditStipulation[] | undefined;
  error: Error | undefined;
  isLoading: boolean;
  isValidating: boolean;
  mutate: () => Promise<CreditStipulation[] | undefined>;
  role: StipulationsApiRole;
  canMutate: boolean;
  verify: (stipulationId: string, notes?: string) => Promise<void>;
  reject: (stipulationId: string, reason: string) => Promise<void>;
  create: (payload: StipulationCreatePayload) => Promise<void>;
  sendPendingToDealer: () => Promise<{
    uploadLinksIssued: number;
    notifyOk: boolean;
    notifyUnsupported: boolean;
  }>;
}

export function useStipulations(
  applicationId: string | undefined,
  tenantId?: string | null,
): UseStipulationsResult {
  const role = resolveStipulationsApiRoleFromStorage();
  const canMutate = canMutateStipulations(role);
  const key = applicationId?.trim() ? (["stipulations", applicationId.trim(), role] as const) : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    key,
    async ([, id, r]) => getStipulations(id, r),
    {
      refreshInterval: 10_000,
      revalidateOnFocus: true,
      dedupingInterval: 2000,
    },
  );

  const mutateList = useCallback(() => mutate(), [mutate]);

  const verify = useCallback(
    async (stipulationId: string, notes?: string) => {
      if (!applicationId?.trim()) return;
      const id = applicationId.trim();
      const rollback = data;
      emitWorkflowStipulationAudit(tenantId ?? undefined, id, "stipulation_verify_request", { stipulation_id: stipulationId });
      await mutate(
        (cur) =>
          cur?.map((s) =>
            s.id === stipulationId
              ? { ...s, status: "verified" as const, verified_at: new Date().toISOString() }
              : s,
          ),
        false,
      );
      try {
        await verifyStipulation(id, stipulationId, notes, role);
        emitWorkflowStipulationAudit(tenantId ?? undefined, id, "stipulation_verified", { stipulation_id: stipulationId });
        await mutate();
      } catch (e) {
        await mutate(rollback, false);
        throw e;
      }
    },
    [applicationId, data, mutate, role, tenantId],
  );

  const reject = useCallback(
    async (stipulationId: string, reason: string) => {
      if (!applicationId?.trim()) return;
      const id = applicationId.trim();
      const rollback = data;
      const r = reason.trim();
      emitWorkflowStipulationAudit(tenantId ?? undefined, id, "stipulation_reject_request", { stipulation_id: stipulationId });
      await mutate(
        (cur) =>
          cur?.map((s) =>
            s.id === stipulationId
              ? {
                  ...s,
                  status: "rejected" as const,
                  rejected_at: new Date().toISOString(),
                  reject_reason: r,
                }
              : s,
          ),
        false,
      );
      try {
        await rejectStipulation(id, stipulationId, reason, role);
        emitWorkflowStipulationAudit(tenantId ?? undefined, id, "stipulation_rejected", { stipulation_id: stipulationId });
        await mutate();
      } catch (e) {
        await mutate(rollback, false);
        throw e;
      }
    },
    [applicationId, data, mutate, role, tenantId],
  );

  const create = useCallback(
    async (payload: StipulationCreatePayload) => {
      if (!applicationId?.trim()) return;
      const id = applicationId.trim();
      emitWorkflowStipulationAudit(tenantId ?? undefined, id, "stipulation_create_request", {
        type: payload.type,
        dealer_id: payload.dealer_id,
      });
      try {
        await createStipulation(id, payload, role);
        emitWorkflowStipulationAudit(tenantId ?? undefined, id, "stipulation_created", { type: payload.type });
        await mutate();
      } catch (e) {
        emitWorkflowStipulationAudit(tenantId ?? undefined, id, "stipulation_create_failed", {
          detail: e instanceof Error ? e.message : String(e),
        });
        throw e;
      }
    },
    [applicationId, mutate, role, tenantId],
  );

  const sendPendingToDealer = useCallback(async () => {
    if (!applicationId?.trim()) {
      return { uploadLinksIssued: 0, notifyOk: false, notifyUnsupported: false };
    }
    const appId = applicationId.trim();
    const rows = data ?? [];
    const pending = rows.filter((s) => s.status === "pending");
    let uploadLinksIssued = 0;
    const ids: string[] = [];
    for (const s of pending) {
      try {
        await postStipulationUploadLink(appId, s.id, role);
        uploadLinksIssued += 1;
        ids.push(s.id);
        emitWorkflowStipulationAudit(tenantId ?? undefined, appId, "stipulation_upload_link_sent", {
          stipulation_id: s.id,
        });
      } catch {
        emitWorkflowStipulationAudit(tenantId ?? undefined, appId, "stipulation_upload_link_failed", {
          stipulation_id: s.id,
        });
      }
    }
    const n = await notifyDealerStipulationWorkflow(appId, ids, role);
    emitWorkflowStipulationAudit(tenantId ?? undefined, appId, "stipulation_notify_dealer", {
      ok: n.ok,
      unsupported: n.unsupported,
      count: ids.length,
    });
    await mutate();
    return {
      uploadLinksIssued,
      notifyOk: n.ok,
      notifyUnsupported: Boolean(n.unsupported),
    };
  }, [applicationId, data, mutate, role, tenantId]);

  return {
    stipulations: data,
    error: error as Error | undefined,
    isLoading: Boolean(key && isLoading && data === undefined),
    isValidating,
    mutate: mutateList,
    role,
    canMutate,
    verify,
    reject,
    create,
    sendPendingToDealer,
  };
}

export { useBankStipulationsWorkflow } from "./useBankStipulationsWorkflow";
