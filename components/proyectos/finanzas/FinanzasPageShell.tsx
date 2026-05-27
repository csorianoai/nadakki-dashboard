"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { motion } from "@/lib/motion-stub";
import GlassCard from "@/components/ui/GlassCard";
import { BP_ACCENTS } from "@/components/proyectos/blueprint-projects-helpers";

export function FinanzasPageShell({
  proyectoId,
  title,
  description,
  icon,
  children,
  actions,
}: {
  proyectoId: string;
  title: string;
  description: string;
  icon?: ReactNode;
  children: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="space-y-6 pb-10">
      <Link
        href={`/proyectos/${encodeURIComponent(proyectoId)}/finanzas`}
        className="text-xs font-bold uppercase tracking-[0.14em] text-amber-200 hover:text-white"
      >
        ← Finanzas del proyecto
      </Link>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <GlassCard hover={false} className="flex flex-wrap items-start justify-between gap-4 p-6">
          <div className="flex gap-4">
            {icon ? <div className="text-amber-300">{icon}</div> : null}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: BP_ACCENTS.glow }}>
                Finanzas operativas
              </p>
              <h1 className="text-2xl font-bold text-white">{title}</h1>
              <p className="mt-2 max-w-2xl text-sm text-zinc-400">{description}</p>
            </div>
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </GlassCard>
      </motion.div>
      {children}
    </div>
  );
}
