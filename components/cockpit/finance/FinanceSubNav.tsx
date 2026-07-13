"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { COCKPIT_FINANCE_FLAGS } from "@/lib/cockpit/finance-v3/flags";
import { useCockpit } from "@/lib/cockpit/context";

const TABS = [
  { href: "/cockpit/finance/revenue", label: "Ingresos" },
  { href: "/cockpit/finance/population", label: "Población" },
  {
    href: "/cockpit/finance/registry",
    label: "Registro",
    superadminOnly: true,
    flag: "registry" as const,
  },
] as const;

export function FinanceSubNav() {
  const pathname = usePathname();
  const { isPlatformSuperadmin } = useCockpit();

  if (!COCKPIT_FINANCE_FLAGS.COCKPIT_FINANCE_ENABLED) return null;

  return (
    <nav className="mb-6 flex flex-wrap gap-2 border-b border-cockpit-border pb-3" data-testid="finance-subnav">
      {TABS.filter((t) => {
        if ("flag" in t && t.flag === "registry" && !COCKPIT_FINANCE_FLAGS.COCKPIT_FINANCE_REGISTRY_ENABLED) {
          return false;
        }
        return !("superadminOnly" in t) || isPlatformSuperadmin;
      }).map((tab) => {
        const active = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-cockpit-accent/15 text-cockpit-text"
                : "text-cockpit-muted hover:bg-cockpit-border/40 hover:text-cockpit-text"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
