/** Monthly origination goals — GET /api/v2/credit/goals/monthly/{period} */

export type GoalsRoleScope = "dealer" | "bank" | "admin";

export interface MonthlyGoalItem {
  metric_key: string;
  target_value: number;
  current_value: number;
  unit: string;
  label_es: string | null;
}

export interface MonthlyGoalsResponse {
  tenant_id: string;
  period: string;
  role_scope: GoalsRoleScope;
  goals: MonthlyGoalItem[];
}
