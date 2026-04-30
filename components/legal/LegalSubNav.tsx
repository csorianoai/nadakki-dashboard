"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/legal", label: "Home" },
  { href: "/legal/research", label: "Research" },
  { href: "/legal/audit", label: "Audit" },
];

export function LegalSubNav() {
  const pathname = usePathname();
  return (
    <nav
      className="mb-6 flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800"
      aria-label="Legal Core"
    >
      {links.map((l) => {
        const active = pathname === l.href || (l.href !== "/legal" && pathname.startsWith(l.href));
        return (
          <Link
            key={l.href}
            href={l.href}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
              active
                ? "bg-blue-600 text-white dark:bg-blue-500"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            )}
          >
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
