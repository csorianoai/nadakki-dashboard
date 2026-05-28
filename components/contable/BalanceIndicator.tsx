"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { CONTABLE_TOLERANCE } from "@/types/contable";

export function BalanceIndicator({
  totalDebe,
  totalHaber,
  className,
}: {
  totalDebe: number;
  totalHaber: number;
  className?: string;
}) {
  const diff = Math.round((totalDebe - totalHaber) * 100) / 100;
  const cuadra = Math.abs(diff) <= CONTABLE_TOLERANCE && totalDebe > 0;

  return (
    <div
      className={cn(
        "rounded-xl border p-4 transition-colors",
        cuadra
          ? "border-emerald-500/40 bg-emerald-500/10"
          : "border-rose-500/40 bg-rose-500/10",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {cuadra ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400" aria-hidden />
          ) : (
            <XCircle className="h-5 w-5 text-rose-400" aria-hidden />
          )}
          <span className={cn("text-sm font-bold", cuadra ? "text-emerald-200" : "text-rose-200")}>
            {cuadra ? "CUADRA" : "NO CUADRA"}
          </span>
        </div>
        <span className="font-mono text-xs text-zinc-400">
          Diferencia: {diff.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Total debe (base)</p>
          <p className="font-mono text-lg font-semibold text-white">
            {totalDebe.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-wide text-zinc-500">Total haber (base)</p>
          <p className="font-mono text-lg font-semibold text-white">
            {totalHaber.toLocaleString("es-DO", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
}
