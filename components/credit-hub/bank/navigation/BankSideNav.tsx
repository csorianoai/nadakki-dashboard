"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardList, Gauge, History, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/credit-hub/bank", label: "Dashboard", icon: Gauge },
  { href: "/credit-hub/bank/applications", label: "Bandeja", icon: ClipboardList },
  { href: "/credit-hub/bank/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/credit-hub/bank/compliance", label: "Compliance", icon: ShieldCheck },
  { href: "/credit-hub/bank/audit", label: "Audit", icon: History },
];

export function BankSideNav() {
  const pathname = usePathname();
  return (
    <aside className="hidden w-64 shrink-0 border-r border-forge-border bg-forge-surface/40 p-4 lg:block">
      <nav className="sticky top-20 space-y-2">
        {items.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || (item.href !== "/credit-hub/bank" && pathname?.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors",
                active ? "bg-forge-primary text-white shadow-lg shadow-forge-primary/20" : "text-forge-text-muted hover:bg-forge-surface-elevated hover:text-forge-text"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
