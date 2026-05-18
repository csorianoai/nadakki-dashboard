"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SWRConfig } from "swr";
import NavigationBar from "@/components/ui/NavigationBar";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/observability/dashboard", label: "Dashboard" },
  { href: "/admin/observability/audit-trail", label: "Audit trail" },
  { href: "/admin/observability/sla-monitoring", label: "SLA" },
];

export default function AdminObservabilityLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <SWRConfig
      value={{
        refreshInterval: 30_000,
        revalidateOnFocus: true,
        dedupingInterval: 5000,
      }}
    >
      <div className="ndk-page ndk-fade-in">
        <NavigationBar backHref="/admin">
          <span className="text-sm text-gray-400">Observabilidad</span>
        </NavigationBar>

        <nav className="mb-8 flex flex-wrap gap-2 border-b border-white/10 pb-3" aria-label="Observabilidad admin">
          {TABS.map((t) => {
            const active = pathname === t.href || pathname.startsWith(`${t.href}/`);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-white/10 text-white" : "text-gray-400 hover:bg-white/5 hover:text-gray-200",
                )}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>

        {children}
      </div>
    </SWRConfig>
  );
}
