"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { slug: "plan-cuentas", label: "Plan de cuentas" },
  { slug: "periodos", label: "Periodos" },
  { slug: "asientos/nuevo", label: "Crear asiento" },
  { slug: "libro-mayor", label: "Libro mayor" },
  { slug: "balance-comprobacion", label: "Balance comprobación" },
] as const;

export function ContableSubNav() {
  const pathname = usePathname();
  const base = "/contable";

  return (
    <nav aria-label="Sub-navegación contable" className="mb-6 flex flex-wrap gap-2 border-b border-white/10 pb-3">
      {TABS.map(({ slug, label }) => {
        const href = `${base}/${slug}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={slug}
            href={href}
            className={cn(
              "inline-flex min-h-9 items-center rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              active
                ? "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/40"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
