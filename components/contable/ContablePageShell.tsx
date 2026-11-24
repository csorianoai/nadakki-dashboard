"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import GlassCard from "@/components/ui/GlassCard";
import { FacturacionElectronicaAviso } from "@/components/contable/FacturacionElectronicaAviso";

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
              Contable
            </p>
            <h1 className="text-2xl font-bold text-white">{title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-zinc-400">{description}</p>
            {process.env.NEXT_PUBLIC_CONTABLE_USE_MOCKS !== "false" ? (
              <p data-testid="contable-demo-badge" role="note" className="mt-2 inline-flex rounded-full border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-200">
                DEMO · Datos de muestra, no conectados al servidor
              </p>
            ) : null}
          </div>
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </GlassCard>
      {/*
        Va en el shell y no en cada pantalla: el estado fiscal del tenant es el
        mismo en todas, y repetirlo doce veces garantiza que alguna se olvide.
      */}
      <FacturacionElectronicaAviso />
      {children}
    </div>
  );
}
