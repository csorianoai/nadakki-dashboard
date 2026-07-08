import type { GoalStatus } from "@/components/credit-hub/elite/GoalCard";
import { chMoney } from "@/lib/credit-hub/ch-base";
import { formatDealerMoney } from "@/lib/credit-hub/dealer/dealerFormat";
import type { MonthlyGoalItem } from "../types/goals";

export type PresentedGoal = {
  title: string;
  status: GoalStatus;
  currentDisplay: string;
  targetDisplay: string;
  pct: number;
  projectionLine: string;
};

function formatValue(value: number, unit: string, currency: string): string {
  const u = unit.toLowerCase();
  if (u === "ratio") return `${Math.round(value * 100)}%`;
  if (u === "hours" || u === "hour") return `${Math.round(value * 10) / 10}h`;
  if (u === "dop" || u === "currency") return chMoney(value);
  if (u === "count") return String(Math.round(value));
  return String(value);
}

function formatTarget(value: number, unit: string, currency: string): string {
  const u = unit.toLowerCase();
  if (u === "ratio") return `≥${Math.round(value * 100)}%`;
  if (u === "hours" || u === "hour") return `≤${Math.round(value * 10) / 10}h`;
  if (u === "dop" || u === "currency") return formatDealerMoney(value, currency);
  if (u === "count") return String(Math.round(value));
  return String(value);
}

function goalStatus(current: number, target: number, unit: string): GoalStatus {
  const u = unit.toLowerCase();
  if (u === "hours" || u === "hour") {
    if (target <= 0) return "en camino";
    if (current <= target) return "cumplido";
    if (current > target * 1.15) return "atrasado";
    return "en camino";
  }
  if (target <= 0) return "en camino";
  if (current >= target) return "cumplido";
  const pct = (current / target) * 100;
  if (pct < 55) return "atrasado";
  return "en camino";
}

function goalPct(current: number, target: number, unit: string): number {
  const u = unit.toLowerCase();
  if (u === "hours" || u === "hour") {
    if (target <= 0) return 0;
    if (current <= target) return 100;
    return Math.max(0, Math.min(100, Math.round(100 - ((current - target) / target) * 100)));
  }
  if (target <= 0) return 0;
  return Math.min(100, Math.round((current / target) * 100));
}

export function presentMonthlyGoal(goal: MonthlyGoalItem, currency: string, period: string): PresentedGoal {
  const title = goal.label_es?.trim() || goal.metric_key.replace(/_/g, " ");
  const current = goal.current_value ?? 0;
  const target = goal.target_value ?? 0;
  const pct = goalPct(current, target, goal.unit);
  const status = goalStatus(current, target, goal.unit);

  return {
    title,
    status,
    currentDisplay: formatValue(current, goal.unit, currency),
    targetDisplay: formatTarget(target, goal.unit, currency),
    pct,
    projectionLine: `Periodo ${period} · ${pct}% de meta`,
  };
}

export function daysRemainingInMonth(date = new Date()): number {
  const last = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return Math.max(0, last - date.getDate());
}

export function formatGoalsMonthLabel(period: string): string {
  const [y, m] = period.split("-").map(Number);
  if (!y || !m) return period;
  return new Date(y, m - 1, 1).toLocaleDateString("es-DO", { month: "long", year: "numeric" });
}
