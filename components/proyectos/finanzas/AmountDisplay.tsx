import type { CurrencyCode } from "@/types/finanzas";
import { cn } from "@/lib/utils";

export function AmountDisplay({
  amount,
  currency = "USD",
  className,
  emphasize,
}: {
  amount: number;
  currency?: CurrencyCode;
  className?: string;
  emphasize?: boolean;
}) {
  const formatted = new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);

  return (
    <span className={cn("font-mono tabular-nums", emphasize ? "font-semibold text-amber-200" : "text-zinc-200", className)}>
      {formatted}
    </span>
  );
}

export function VarianceDisplay({ pct, className }: { pct: number; className?: string }) {
  const abs = Math.abs(pct);
  const tone = abs < 5 ? "text-emerald-400" : abs <= 15 ? "text-amber-400" : "text-rose-400";
  const sign = pct > 0 ? "+" : "";
  return <span className={cn("font-mono font-semibold tabular-nums", tone, className)}>{sign}{pct.toFixed(1)}%</span>;
}
