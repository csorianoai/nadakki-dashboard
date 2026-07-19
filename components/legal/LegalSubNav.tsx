"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Search, FileText, ScrollText, Settings, Briefcase, Gavel, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

type NavLink = {
  href: string;
  label: string;
  icon: typeof Home;
};

const links: NavLink[] = [
  { href: "/legal", label: "Inicio", icon: Home },
  { href: "/legal/cases", label: "Expedientes", icon: Briefcase },
  { href: "/legal/audiencias", label: "Audiencias", icon: Gavel },
  { href: "/legal/research", label: "Investigación", icon: Search },
  { href: "/legal/contracts", label: "Contratos", icon: FileText },
  { href: "/legal/library", label: "Biblioteca", icon: BookOpen },
  { href: "/legal/audit", label: "Auditoría", icon: ScrollText },
  { href: "/legal/config", label: "Configuración", icon: Settings },
];

export function LegalSubNav() {
  const pathname = usePathname();
  return (
    <nav
      className="sticky top-0 z-20 -mx-4 mb-2 border-b border-zinc-800/50 bg-zinc-950/60 px-2 py-3 backdrop-blur-md md:-mx-6"
      aria-label="Legal"
    >
      <div className="flex flex-wrap gap-2">
        {links.map((l) => {
          const Icon = l.icon;
          const isActive =
            l.href === "/legal"
              ? pathname === "/legal"
              : pathname === l.href || pathname.startsWith(`${l.href}/`);
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg px-3.5 py-2 text-sm font-medium tracking-tight transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
                isActive
                  ? "text-zinc-100"
                  : "text-zinc-400 hover:bg-zinc-900/80 hover:text-zinc-200"
              )}
            >
              {isActive ? (
                <motion.span
                  layoutId="legal-subnav-pill"
                  className="absolute inset-0 rounded-lg bg-gradient-to-br from-violet-600/25 to-indigo-600/20 ring-1 ring-violet-500/35"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              ) : null}
              <Icon className="relative h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="relative">{l.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
