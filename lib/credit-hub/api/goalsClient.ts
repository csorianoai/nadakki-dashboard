import { chFetch } from "./client";
import type { GoalsRoleScope, MonthlyGoalsResponse } from "../types/goals";

export type MonthlyGoalsParams = {
  tenantId: string;
  period: string;
  roleScope: GoalsRoleScope;
};

export function getMonthlyGoals(params: MonthlyGoalsParams): Promise<MonthlyGoalsResponse> {
  const q = `?role_scope=${encodeURIComponent(params.roleScope)}`;
  return chFetch<MonthlyGoalsResponse>(
    `/api/v2/credit/goals/monthly/${encodeURIComponent(params.period)}${q}`,
    { tenantId: params.tenantId, actorRole: params.roleScope === "bank" ? "bank_admin" : "dealer" },
  );
}

/** Current calendar month as `yyyy-mm` (matches backend period format). */
export function currentGoalsPeriod(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
}
