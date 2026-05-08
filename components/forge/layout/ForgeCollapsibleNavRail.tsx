"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gauge, Home, LayoutDashboard, Megaphone, Scale, ScrollText } from "lucide-react";
import { cn } from "@/lib/utils";
import { useForgeLayoutChrome } from "./ForgeLayoutChromeContext";

const RAIL_LINKS = [
  { href: "/", label: "Inicio suite", icon: Home },
  { href: "/credit-hub", label: "Credit Hub", icon: Gauge },
  { href: "/legal", label: "Legal Core", icon: Scale },
  { href: "/sic", label: "SIC", icon: ScrollText },
  { href: "/marketing", label: "Marketing", icon: Megaphone },
] as const;

function isActiveHref(href: string, pathname: string | null): boolean {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function ForgeCollapsibleNavRail() {
  const pathname = usePathname();
  const { railCollapsed } = useForgeLayoutChrome();

  return (
    <aside
      className={cn(
        "hidden shrink-0 flex-col border-r border-zinc-800/50 bg-zinc-950 transition-[width] duration-200 ease-out lg:flex",
        railCollapsed ? "w-14" : "w-60"
      )}
      aria-label="Navegación entre cores"
    >
      <div
        className={cn(
          "flex items-center gap-2 border-b border-zinc-800/50 px-2 py-3",
          railCollapsed && "justify-center px-0"
        )}
      >
        <LayoutDashboard className="h-5 w-5 shrink-0 text-violet-400" aria-hidden />
        {!railCollapsed ? (
          <span className="truncate text-xs font-semibold uppercase tracking-wide text-zinc-400">Navegación</span>
        ) : null}
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-1.5">
        {RAIL_LINKS.map(({ href, label, icon: Icon }) => {
          const active = isActiveHref(href, pathname);
          return (
            <Link
              key={href}
              href={href}
              title={railCollapsed ? label : undefined}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-lg px-2 py-2 text-sm font-medium transition-colors",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-500",
                railCollapsed && "justify-center px-0",
                active
                  ? "bg-violet-500/15 text-violet-200 ring-1 ring-violet-500/25"
                  : "text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {!railCollapsed ? <span className="truncate">{label}</span> : <span className="sr-only">{label}</span>}
            </Link>
          );
        })}
      </nav>
      {!railCollapsed ? (
        <p className="border-t border-zinc-800/50 px-2 py-2 text-[10px] leading-snug text-zinc-600">
          Accesos rápidos. Usa la barra superior para cambiar de core con una vista clara.
        </p>
      ) : null}
    </aside>
  );
}
