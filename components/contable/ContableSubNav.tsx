"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  CalendarRange,
  FilePenLine,
  BookMarked,
  Scale,
  TrendingUp,
  PieChart,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { slug: "resumen", label: "Resumen", icon: LayoutDashboard },
  { slug: "plan-cuentas", label: "Plan de Cuentas", icon: BookOpen },
  { slug: "periodos", label: "Períodos", icon: CalendarRange },
  { slug: "asientos/nuevo", label: "Nuevo Asiento", icon: FilePenLine },
  { slug: "libro-mayor", label: "Libro Mayor", icon: BookMarked },
  { slug: "balance-comprobacion", label: "Balance", icon: Scale },
  { slug: "estado-resultados", label: "Estado de Resultados", icon: TrendingUp },
  { slug: "situacion-financiera", label: "Situación Financiera", icon: PieChart },
  { slug: "monitor-gastos", label: "Monitor Gastos", icon: AlertTriangle },
  { slug: "agente-ia", label: "Consultor IA", icon: Sparkles },
] as const;

export function ContableSubNav() {
  const pathname = usePathname();
  const base = "/contable";

  return (
    <nav
      aria-label="Sub-navegación contable"
      className="mb-6 flex gap-2 overflow-x-auto border-b border-white/10 pb-3 scrollbar-thin scrollbar-thumb-zinc-700"
    >
      {TABS.map(({ slug, label, icon: Icon }) => {
        const href = `${base}/${slug}`;
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={slug}
            href={href}
            className={cn(
              "inline-flex min-h-9 shrink-0 items-center whitespace-nowrap gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition",
              active
                ? "bg-emerald-500/20 text-emerald-100 ring-1 ring-emerald-400/40"
                : "text-zinc-400 hover:bg-white/5 hover:text-zinc-100",
            )}
          >
            <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span data-testid="contable-tab-label">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
