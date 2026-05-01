"use client";

import type { ReactNode } from "react";

type Variant = "dealer-sunset" | "bank-slate";

const shells: Record<
  Variant,
  { gradient: string; orbs: string }
> = {
  "dealer-sunset": {
    gradient: "from-[#FF6B35] via-[#FF8C42] to-[#FFB627]",
    orbs: "opacity-30",
  },
  "bank-slate": {
    gradient: "from-slate-900 via-slate-800 to-emerald-950/80",
    orbs: "opacity-20",
  },
};

export function CreditHeroShell({
  variant,
  children,
  className = "",
}: {
  variant: Variant;
  children: ReactNode;
  className?: string;
}) {
  const s = shells[variant];
  return (
    <section
      className={`relative mb-8 overflow-hidden rounded-3xl border border-white/10 shadow-2xl shadow-black/20 ${className}`}
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${s.gradient}`} />
      <div
        className={`pointer-events-none absolute inset-0 ${s.orbs}`}
        style={{
          background:
            "radial-gradient(ellipse at 0% 0%, rgba(255,255,255,0.12), transparent 55%), radial-gradient(ellipse at 100% 100%, rgba(16,185,129,0.15), transparent 50%)",
        }}
      />
      <div className="pointer-events-none absolute -right-16 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-12 left-0 h-40 w-40 rounded-full bg-emerald-400/10 blur-2xl" />
      <div className="relative">{children}</div>
    </section>
  );
}
