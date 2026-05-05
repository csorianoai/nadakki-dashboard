"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Search, FileText, ScrollText, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  icon: typeof Home;
};

const links: NavLink[] = [
  { href: "/legal", label: "Home", icon: Home },
  { href: "/legal/research", label: "Research", icon: Search },
  { href: "/legal/contracts", label: "Contratos", icon: FileText },
  { href: "/legal/audit", label: "Audit", icon: ScrollText },
  { href: "/legal/config", label: "Config", icon: Settings },
];

export function LegalSubNav() {
  const pathname = usePathname();
  return (
    <nav
      className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800"
      aria-label="Legal Core"
    >
      {links.map((l) => {
        const Icon = l.icon;
        const active = pathname === l.href || (l.href !== "/legal" && pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              active
                ? "bg-blue-600 text-white shadow-sm dark:bg-blue-500"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 dark:hover:text-slate-50"
            )}
          >
            <Icon className="h-4 w-4" aria-hidden="true" />
            <span>{l.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}