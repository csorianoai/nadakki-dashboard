"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  LayoutDashboard,
  Package,
  Share2,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/autos/dealer", label: "Dashboard", icon: LayoutDashboard },
  {
    href: "/autos/dealer/publicar-rapido",
    label: "Publicar Rápido con AI",
    icon: Upload,
    badge: "NUEVO",
  },
  { href: "/autos/dealer/inventario", label: "Inventario", icon: Package },
  { href: "/autos/dealer/conexiones", label: "Conexiones", icon: Share2 },
  { href: "/autos/dealer/leads", label: "Leads Prioritarios", icon: Users },
  { href: "/autos/dealer/insights", label: "Insights AI", icon: BarChart3 },
];

export default function DealerLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="mx-auto flex max-w-[1440px] gap-6 px-[clamp(16px,3vw,22px)] py-6">
      <aside className="hidden w-64 shrink-0 lg:block">
        <div className="sticky top-24 rounded-r-sm border border-nk-border bg-nk-surface p-4">
          <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-brand-2">
            <Sparkles className="h-3.5 w-3.5" />
            Dealer Portal
          </p>
          <nav className="space-y-1">
            {NAV.map((item) => {
              const active =
                item.href === "/autos/dealer"
                  ? pathname === "/autos/dealer"
                  : pathname?.startsWith(item.href);
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex min-h-10 items-center gap-2 rounded-r-sm px-3 text-sm font-medium transition",
                    active
                      ? "bg-brand-2/10 font-bold text-brand-2"
                      : "text-nk-fg-muted hover:bg-nk-surface-2 hover:text-nk-fg",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1">{item.label}</span>
                  {item.badge ? (
                    <span className="rounded-full bg-brand-2 px-2 py-0.5 text-[9px] font-bold text-white">
                      {item.badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
