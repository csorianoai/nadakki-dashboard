"use client";

import { useQuery } from "@tanstack/react-query";
import { currentGoalsPeriod, getMonthlyGoals } from "../api/goalsClient";
import type { GoalsRoleScope } from "../types/goals";
import { chKeys } from "./queryKeys";
import { useTenant } from "./useTenant";

export function useMonthlyGoals(roleScope: GoalsRoleScope, period = currentGoalsPeriod()) {
  const { apiTenantId } = useTenant();
  return useQuery({
    queryKey: chKeys.monthlyGoals(apiTenantId ?? "", period, roleScope),
    queryFn: () =>
      getMonthlyGoals({
        tenantId: apiTenantId!,
        period,
        roleScope,
      }),
    enabled: !!apiTenantId,
    staleTime: 60_000,
  });
}
