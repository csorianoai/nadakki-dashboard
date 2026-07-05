import { NAUTA_JUNIOR_ANALYST_HOURS_MONTH, NAUTA_USD_DOP_RATE } from "./config";

const dop = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "DOP",
  maximumFractionDigits: 0,
});

const dopCompact = new Intl.NumberFormat("es-DO", {
  style: "currency",
  currency: "DOP",
  notation: "compact",
  maximumFractionDigits: 1,
});

const num = new Intl.NumberFormat("es-DO");

export function formatDop(amount: number): string {
  return dop.format(amount);
}

export function formatDopCompact(amount: number): string {
  return dopCompact.format(amount);
}

export function formatNumber(n: number): string {
  return num.format(n);
}

export function usdToDop(usd: number): number {
  return usd * NAUTA_USD_DOP_RATE;
}

export function formatUsdMonthAsDop(usdMonth: number): string {
  return formatDop(usdToDop(usdMonth));
}

export function juniorAnalystsFromHours(hours: number): number {
  return Math.max(1, Math.round(hours / NAUTA_JUNIOR_ANALYST_HOURS_MONTH));
}
