"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, Cable, Car, Gauge, LayoutDashboard, PackagePlus, Users } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/autos/dealer", label: "Inicio", icon: LayoutDashboard },
  { href: "/autos/dealer/inventario", label: "Inventario", icon: Car },
  { href: "/autos/dealer/publicar-rapido", label: "Publicar", icon: PackagePlus },
  { href: "/autos/dealer/leads", label: "Leads", icon: Users },
  { href: "/autos/dealer/insights", label: "Insights", icon: BarChart3 },
  { href: "/autos/dealer/conexiones", label: "Conexiones", icon: Cable },
  { href: "/autos/dealer/estado", label: "Estado", icon: Gauge },
];

function NavLinks({ className }: { className?: string }) {
  const pathname = usePathname();
  return <nav className={className} aria-label="Dealer Management">{NAV.map((item) => {
    const active = item.href === "/autos/dealer" ? pathname === item.href : pathname?.startsWith(item.href);
    const Icon = item.icon;
    return <Link key={item.href} href={item.href} className={cn("flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm font-medium transition", active ? "bg-brand-2/10 font-bold text-brand-2" : "text-nk-fg-muted hover:bg-nk-surface-2 hover:text-nk-fg")}>
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" /><span className="whitespace-nowrap">{item.label}</span>
    </Link>;
  })}</nav>;
}

export default function DealerLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx-auto flex max-w-[1440px] flex-col gap-4 px-[clamp(16px,3vw,22px)] py-6 lg:flex-row lg:gap-6">
    <div className="max-w-full overflow-x-auto lg:hidden"><NavLinks className="flex min-w-max gap-1" /></div>
    <aside className="hidden w-56 shrink-0 lg:block"><div className="sticky top-24 rounded-2xl border border-nk-border bg-nk-surface p-3 shadow-nk-sm">
      <p className="mb-2 px-3 text-xs font-bold uppercase tracking-[0.14em] text-brand-2">Dealer Management</p><NavLinks className="space-y-1" />
    </div></aside>
    <div className="min-w-0 flex-1">{children}</div>
  </div>;
}
