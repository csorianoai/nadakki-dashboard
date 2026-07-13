"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCockpit } from "@/lib/cockpit/context";

const TABS: Array<{ href: string; label: string; superadminOnly?: boolean }> = [
  { href: "/cockpit/finance/revenue", label: "Ingresos" },
  { href: "/cockpit/finance/population", label: "Población" },
  { href: "/cockpit/finance/registry", label: "Registro", superadminOnly: true },
];

export function FinanceSubNav() {
  const pathname = usePathname();
  const { isPlatformSuperadmin } = useCockpit();
  const visible = TABS.filter((t) => !t.superadminOnly || isPlatformSuperadmin);

  return (
    <nav
      className="mb-6 flex gap-1 border-b border-cockpit-border"
      aria-label="Secciones de Finanzas"
      data-testid="finance-sub-nav"
    >
      {visible.map((tab) => {
        const active = pathname?.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              active
                ? "border-cockpit-accent text-cockpit-text"
                : "border-transparent text-cockpit-muted hover:text-cockpit-text"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
