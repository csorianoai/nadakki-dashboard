"use client";

import { useCallback, useMemo } from "react";
import useSWR from "swr";
import type { CreditStipulation, StipulationsApiRole } from "@/lib/api/stipulations-types";
import {
  getStipulations,
  rejectStipulation,
  verifyStipulation,
} from "@/lib/api/stipulations";
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
}

export function useStipulations(applicationId: string | undefined): UseStipulationsResult {
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
        await mutate();
      } catch (e) {
        await mutate(rollback, false);
        throw e;
      }
    },
    [applicationId, data, mutate, role],
  );

  const reject = useCallback(
    async (stipulationId: string, reason: string) => {
      if (!applicationId?.trim()) return;
      const id = applicationId.trim();
      const rollback = data;
      const r = reason.trim();
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
        await mutate();
      } catch (e) {
        await mutate(rollback, false);
        throw e;
      }
    },
    [applicationId, data, mutate, role],
  );

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
  };
}
