"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Calculator, FileText, Home, Plus, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";

export function DealerBottomNav() {
  const pathname = usePathname();
  const t = useTranslations();
  const navItems = [
    { href: "/credit-hub/dealer", icon: Home, label: t.dealer.top_nav_dashboard },
    { href: "/credit-hub/dealer/applications", icon: FileText, label: "Solicitudes" },
    { href: "/credit-hub/dealer/preapproval", icon: Calculator, label: t.simulator.nav_short },
    { href: "/credit-hub/dealer/applications/new", icon: Plus, label: "Nueva", primary: true },
    { href: "/credit-hub/dealer/notifications", icon: Bell, label: "Alertas" },
    { href: "/credit-hub/dealer/profile", icon: User, label: "Perfil" },
  ];

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-forge-border bg-forge-surface lg:hidden" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="grid h-16 grid-cols-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          if (item.primary) {
            return (
              <Link key={item.href} href={item.href} className="flex flex-col items-center justify-center" aria-label="Nueva solicitud">
                <div className="-mt-6 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-forge-primary to-forge-primary-hover shadow-lg shadow-forge-primary/30">
                  <Icon className="h-6 w-6 text-white" aria-hidden="true" />
                </div>
                <span className="mt-0.5 text-[10px] text-forge-text-muted">{item.label}</span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex flex-col items-center justify-center gap-1 transition-colors",
                isActive ? "text-forge-primary" : "text-forge-text-muted hover:text-forge-text"
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              <span className="text-xs">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
