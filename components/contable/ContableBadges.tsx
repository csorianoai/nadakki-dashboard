"use client";

import { cn } from "@/lib/utils";
import type { NaturalezaCuenta, PeriodoStatus, TipoCuenta } from "@/types/contable";

export function NaturalezaBadge({ naturaleza }: { naturaleza: NaturalezaCuenta }) {
  const deudora = naturaleza === "deudora";
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        deudora ? "bg-sky-500/15 text-sky-200 ring-1 ring-sky-400/30" : "bg-violet-500/15 text-violet-200 ring-1 ring-violet-400/30",
      )}
    >
      {naturaleza}
    </span>
  );
}

export function TipoCuentaBadge({ tipo }: { tipo: TipoCuenta }) {
  return (
    <span className="inline-flex rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
      {tipo}
    </span>
  );
}

export function PeriodoStatusBadge({ status }: { status: PeriodoStatus }) {
  const styles: Record<PeriodoStatus, string> = {
    open: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
    soft_closed: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
    locked: "bg-rose-500/15 text-rose-200 ring-rose-400/30",
  };
  const labels: Record<PeriodoStatus, string> = {
    open: "Abierto",
    soft_closed: "Cierre suave",
    locked: "Locked",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1", styles[status])}>
      {labels[status]}
    </span>
  );
}
