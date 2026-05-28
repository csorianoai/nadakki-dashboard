"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import GlassCard from "@/components/ui/GlassCard";

export function ContablePageShell({
  title,
  description,
  icon,
  children,
  actions,
}: {
  title: string;
  description: string;
  icon?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-6 pb-10">
      <Link
        href="/contable"
        className="text-xs font-bold uppercase tracking-[0.14em] text-emerald-200 hover:text-white"
      >
        ← Contabilidad general
      </Link>
      <GlassCard hover={false} className="flex flex-wrap items-start justify-between gap-4 p-6">
        <div className="flex gap-4">
          {icon ? <div className="text-emerald-300">{icon}</div> : null}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-emerald-400/90">
              Contable · Sub-fase 3.1
            </p>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">{description}</p>
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </GlassCard>
      {children}
    </div>
  );
}
