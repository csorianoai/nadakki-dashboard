"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Sparkles, Menu, Gauge, Scale, ScrollText, Megaphone } from "lucide-react";
import TenantSelector from "@/components/ui/TenantSelector";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { useForgeLayoutChrome } from "./ForgeLayoutChromeContext";

const CORE_TABS = [
  { id: "credit", href: "/credit-hub", label: "Credit", icon: Gauge, match: (p: string) => p.startsWith("/credit-hub") },
  { id: "legal", href: "/legal", label: "Legal", icon: Scale, match: (p: string) => p === "/legal" || p.startsWith("/legal/") },
  { id: "sic", href: "/sic", label: "SIC", icon: ScrollText, match: (p: string) => p === "/sic" || p.startsWith("/sic/") },
  {
    id: "marketing",
    href: "/marketing",
    label: "Marketing",
    icon: Megaphone,
    match: (p: string) => p.startsWith("/marketing"),
  },
] as const;

export function UnifiedTopBar() {
  const pathname = usePathname() ?? "";
  const { toggleRail } = useForgeLayoutChrome();
  const { logout } = useAuth();

  return (
    <header
      className="sticky top-0 z-40 grid h-14 min-h-14 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 border-b border-zinc-800/50 bg-zinc-950/80 px-2 backdrop-blur-xl sm:px-4"
      data-forge-unified-topbar
    >
      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
        <button
          type="button"
          onClick={toggleRail}
          className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-lg text-zinc-300 transition-colors hover:bg-zinc-800/80 hover:text-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 lg:flex"
          aria-label="Expandir o contraer barra lateral de navegación"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 rounded-lg pr-2 text-zinc-100 transition-colors hover:text-violet-200"
        >
          <Sparkles className="h-5 w-5 shrink-0 text-violet-400" aria-hidden />
          <span className="hidden font-semibold tracking-tight sm:inline">NADAKKI</span>
        </Link>
      </div>

      <nav
        className="mx-1 flex min-w-0 max-w-[min(100%,28rem)] flex-1 justify-center overflow-x-auto sm:max-w-none md:flex-[2]"
        aria-label="Productos principales"
      >
        <div className="flex max-w-full items-center gap-0.5 rounded-lg bg-zinc-900/50 p-0.5">
          {CORE_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = tab.match(pathname);
            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "relative inline-flex items-center gap-1.5 whitespace-nowrap rounded-md px-2.5 py-1.5 text-xs font-medium sm:px-3 sm:text-sm",
                  active ? "text-violet-200" : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                )}
                aria-current={active ? "page" : undefined}
              >
                {active ? (
                  <motion.span
                    layoutId="unified-core-tab-pill"
                    className="absolute inset-0 rounded-md border border-violet-500/20 bg-violet-500/10"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                ) : null}
                <Icon className="relative z-10 h-4 w-4 shrink-0" aria-hidden />
                <span className="relative z-10">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

      <div className="flex min-w-0 items-center justify-end gap-2 sm:gap-3">
        <TenantSelector />
        <button
          type="button"
          onClick={() => logout()}
          className="shrink-0 rounded-lg px-2 py-1.5 text-xs font-medium text-zinc-500 underline-offset-2 hover:bg-zinc-800/60 hover:text-zinc-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500 sm:text-sm"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
