/** RD$ formatting helpers — HANDOFF locale rules. */

export function formatRd(amount: number, decimals = 2): string {
  return `RD$ ${amount.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

export function formatRdCompact(amount: number): string {
  if (amount >= 1_000_000) return `RD$ ${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `RD$ ${(amount / 1_000).toFixed(1)}K`;
  return formatRd(amount, 0);
}

export function formatPct(value: number, suffix = "%"): string {
  return `${value}${suffix}`;
}
