"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import type { UserInfo } from "@/lib/api/auth-v2";
import { useAuth } from "@/hooks/useAuth";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";
import { cn } from "@/lib/utils";
import {
  NAV_SECTIONS,
  type NavBadge,
  type NavItem,
  type NavSection,
  collectExpandIdsForPath,
  filterSectionsForUser,
  isHrefActive,
  userCanAccessAdminNav,
} from "./forge-global-sidebar-nav";
import { getSidebarTheme, roleAccentClasses, type SidebarCoreTheme } from "./forge-sidebar-core-themes";

export type ForgeGlobalCoresSidebarProps = {
  mobileOpen: boolean;
  onNavigate?: () => void;
};

const STORAGE_KEY = "forge-global-sidebar-expanded-v1";

const CORE_SECTION_IDS = new Set([
  "credit-hub",
  "legal-hub",
  "marketing-hub",
  "projects-hub",
  "sic-hub",
]);

function defaultExpandedAllSections(): Record<string, boolean> {
  const initial: Record<string, boolean> = {};
  NAV_SECTIONS.forEach((s) => {
    initial[s.id] = true;
  });
  return initial;
}

function loadExpanded(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return typeof parsed === "object" && parsed !== null ? parsed : {};
  } catch {
    return {};
  }
}

function badgeClasses(b: NavBadge): string {
  switch (b) {
    case "NEW":
      return "bg-emerald-500/20 text-emerald-400 border border-emerald-500/25";
    case "BETA":
      return "bg-amber-500/20 text-amber-400 border border-amber-500/25";
    case "POPULAR":
      return "bg-pink-500/20 text-pink-400 border border-pink-500/25";
    default:
      return "bg-zinc-700 text-zinc-300 border border-zinc-600";
  }
}

function userInitials(user: UserInfo | null): string {
  if (!user) return "?";
  const name = user.name?.trim();
  if (name) {
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return (parts[0]![0]! + parts[parts.length - 1]![0]!).toUpperCase();
    }
    return parts[0]!.slice(0, 2).toUpperCase();
  }
  const email = user.email ?? "";
  return email.slice(0, 2).toUpperCase() || "?";
}

function GroupLabel({ children }: { children: string }) {
  return (
    <div className="px-3 pt-3 first:pt-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">{children}</p>
      <div className="mt-1.5 h-px bg-zinc-800/90" />
    </div>
  );
}

function SidebarBrand({ onNavigate }: { onNavigate?: () => void }) {
  const { data: branding, isPending } = useTenantBranding();
  return (
    <div className="border-b border-zinc-800 px-3 py-4">
      <Link href="/" onClick={onNavigate} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 rounded-md">
        {branding?.logo_url && !isPending ? (
          <span className="inline-flex h-9 max-w-[10rem] items-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element -- tenant-hosted logo */}
            <img src={branding.logo_url} alt="" className="max-h-9 w-auto object-contain" />
          </span>
        ) : isPending ? (
          <div className="h-8 w-24 animate-pulse rounded bg-zinc-800/80" />
        ) : (
          <span className="block bg-gradient-to-r from-violet-400 via-fuchsia-400 to-pink-400 bg-clip-text text-xl font-bold tracking-tight text-transparent">
            NADAKKI
          </span>
        )}
      </Link>
      <p className="mt-1.5 text-[10px] font-medium text-zinc-500">Suite operativa</p>
    </div>
  );
}

export function ForgeGlobalCoresSidebar({ mobileOpen, onNavigate }: ForgeGlobalCoresSidebarProps) {
  const pathname = usePathname();
  const { tenant, allRoles, user, activeRole, isAuthenticated } = useAuth();
  const showAdmin = userCanAccessAdminNav(allRoles);

  const visibleSections = useMemo(
    () => filterSectionsForUser(NAV_SECTIONS, allRoles, tenant?.subscribed_cores, showAdmin),
    [allRoles, showAdmin, tenant?.subscribed_cores],
  );

  const firstCoreIndex = visibleSections.findIndex((s) => CORE_SECTION_IDS.has(s.id));

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const fromLs = loadExpanded();
    if (Object.keys(fromLs).length === 0) {
      setExpanded(defaultExpandedAllSections());
    } else {
      setExpanded(fromLs);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded));
    } catch {
      /* ignore */
    }
  }, [expanded, hydrated]);

  useEffect(() => {
    const auto = collectExpandIdsForPath(visibleSections, pathname ?? null);
    setExpanded((prev) => {
      const next = { ...prev };
      auto.forEach((id) => {
        next[id] = true;
      });
      return next;
    });
  }, [pathname, visibleSections]);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const renderBadge = (b: NavBadge | undefined) =>
    b ? (
      <span
        className={cn(
          "ml-2 shrink-0 rounded-md px-1.5 py-px text-[9px] font-semibold uppercase leading-tight tracking-wide",
          badgeClasses(b),
        )}
      >
        {b}
      </span>
    ) : null;

  const renderLink = (item: NavItem, depth: number, theme: SidebarCoreTheme) => {
    if (!item.href) return null;
    const active = isHrefActive(item.href, pathname);
    const pad = 12 + depth * 12;
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        style={{ paddingLeft: pad, paddingRight: 8 }}
        className={cn(
          "flex min-h-9 items-center gap-2 rounded-lg py-2 text-sm transition-all duration-200 ease-in-out",
          "focus-visible:outline focus-visible:ring-2 focus-visible:ring-violet-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-950",
          active
            ? cn(
                theme.linkActiveBg,
                theme.linkActiveText,
                "border-l-2",
                theme.linkActiveBorder,
                theme.linkActiveShadow,
              )
            : cn(theme.linkMuted, theme.linkHover, "border-l-2 border-transparent hover:bg-zinc-900/60"),
        )}
        aria-current={active ? "page" : undefined}
      >
        {item.icon ? (
          <item.icon className={cn("h-3.5 w-3.5 shrink-0", active ? theme.linkActiveText : "text-zinc-500")} aria-hidden />
        ) : (
          <span className="h-1 w-1 shrink-0 rounded-full bg-zinc-600" aria-hidden />
        )}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {renderBadge(item.badge)}
      </Link>
    );
  };

  const renderFolder = (item: NavItem, depth: number, theme: SidebarCoreTheme) => {
    const open = expanded[item.id] ?? false;
    const hasKids = Boolean(item.children?.length);
    if (!hasKids) return renderLink(item, depth, theme);
    const pad = 8 + depth * 12;

    return (
      <div className="flex flex-col">
        <button
          type="button"
          onClick={() => toggle(item.id)}
          style={{ paddingLeft: pad, paddingRight: 8 }}
          className={cn(
            "flex min-h-9 w-full items-center gap-2 rounded-lg py-2 text-left text-sm font-semibold transition-colors duration-200 ease-in-out",
            "focus-visible:outline focus-visible:ring-2 focus-visible:ring-violet-500/40",
            theme.folderMuted,
            theme.folderHover,
          )}
          aria-expanded={open}
        >
          {item.icon ? (
            <item.icon className="h-3.5 w-3.5 shrink-0 text-zinc-500" aria-hidden />
          ) : (
            <span className="h-1 w-1 shrink-0 rounded-full bg-zinc-600" aria-hidden />
          )}
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {renderBadge(item.badge)}
          <ChevronRight
            className={cn("h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200 ease-in-out", open && "rotate-90")}
            aria-hidden
          />
        </button>
        <div
          className={cn(
            "overflow-hidden transition-[max-height] duration-200 ease-in-out motion-reduce:transition-none",
            open ? "max-h-[4000px] opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="space-y-0.5 pt-0.5">{item.children!.map((ch) => renderNavItem(ch, depth + 1, theme))}</div>
        </div>
      </div>
    );
  };

  const renderNavItem = (item: NavItem, depth: number, theme: SidebarCoreTheme): ReactNode => {
    if (item.children && item.children.length > 0) {
      return (
        <div key={item.id} className="flex flex-col">
          {renderFolder(item, depth, theme)}
        </div>
      );
    }
    return <div key={item.id}>{renderLink(item, depth, theme)}</div>;
  };

  const renderSection = (section: NavSection) => {
    const open = expanded[section.id] ?? false;
    const theme = getSidebarTheme(section.id);
    const HeaderIcon = theme.Icon;
    const hasActiveInTree =
      pathname &&
      section.children.some(function walk(it: NavItem): boolean {
        if (it.href && isHrefActive(it.href, pathname)) return true;
        return it.children?.some(walk) ?? false;
      });

    return (
      <div
        key={section.id}
        className={cn(
          "mx-2 mb-2 overflow-hidden rounded-xl border border-zinc-800/80 transition-colors duration-200",
          open && theme.sectionTint,
          open && "ring-1 ring-inset ring-white/5",
        )}
      >
        <button
          type="button"
          onClick={() => toggle(section.id)}
          className={cn(
            "flex w-full items-center gap-3 px-2 py-3 text-left transition-colors duration-200 ease-in-out",
            "border-l-4 bg-zinc-900/40",
            open ? theme.borderExpanded : "border-transparent",
            theme.rowHover,
            open ? theme.headerActive : theme.headerIdle,
            hasActiveInTree && !open && "ring-1 ring-inset ring-white/5",
            "focus-visible:outline focus-visible:ring-2 focus-visible:ring-violet-500/40",
          )}
          aria-expanded={open}
        >
          <div className={cn("rounded-lg p-2 ring-1 ring-inset", theme.iconBox, theme.headerRing)}>
            <HeaderIcon className={cn("h-5 w-5", theme.iconText)} aria-hidden />
          </div>
          <span className="min-w-0 flex-1 text-base font-semibold leading-tight">{section.label}</span>
          <ChevronRight
            className={cn("h-5 w-5 shrink-0 text-zinc-500 transition-transform duration-200 ease-in-out", open && "rotate-90")}
            aria-hidden
          />
        </button>
        <div
          className={cn(
            "overflow-hidden transition-[max-height] duration-200 ease-in-out motion-reduce:transition-none",
            open ? "max-h-[8000px] opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="space-y-0.5 border-t border-zinc-800/60 px-1 py-2">{section.children.map((item) => renderNavItem(item, 0, theme))}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        role="presentation"
        className={cn(
          "fixed inset-0 z-40 bg-black/60 transition-opacity lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!mobileOpen}
        onClick={onNavigate}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-80 max-w-[min(100vw,20rem)] shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-100 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.45)] transition-transform motion-reduce:transition-none lg:static lg:z-auto lg:max-w-none lg:translate-x-0 lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        aria-label="Navegación principal"
      >
        <SidebarBrand onNavigate={onNavigate} />

        <nav className="flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden pb-2" aria-label="Navegación por módulos">
          {visibleSections.flatMap((section, index) => {
            const out: ReactNode[] = [];
            if (index === firstCoreIndex && firstCoreIndex >= 0) {
              out.push(<GroupLabel key={`label-cores-${section.id}`}>Cores</GroupLabel>);
            }
            if (section.id === "workflows") {
              out.push(<GroupLabel key="label-automation">Automation</GroupLabel>);
            }
            if (section.id === "admin") {
              out.push(<GroupLabel key="label-platform">Platform</GroupLabel>);
            }
            out.push(renderSection(section));
            return out;
          })}
        </nav>

        <div className="mt-auto border-t border-zinc-800 bg-zinc-950/95 p-3">
          {isAuthenticated && user ? (
            <>
              <div className="flex items-start gap-2.5">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-xs font-bold text-zinc-100 ring-2 ring-zinc-800"
                  aria-hidden
                >
                  {userInitials(user)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-zinc-200">{user.email}</p>
                  {tenant?.display_name ? (
                    <p className="mt-0.5 truncate text-[10px] text-zinc-500">{tenant.display_name}</p>
                  ) : null}
                  <span
                    className={cn(
                      "mt-1 inline-flex max-w-full truncate rounded-md px-2 py-0.5 text-[10px] font-medium",
                      roleAccentClasses(activeRole?.core_name),
                    )}
                  >
                    {activeRole?.display_name ?? activeRole?.role_key ?? "Sin rol"}
                  </span>
                </div>
              </div>
              <Link
                href="/tenants"
                onClick={onNavigate}
                className="mt-2 block rounded-md py-1.5 text-center text-[11px] font-medium text-violet-400 transition-colors hover:text-violet-300"
              >
                Cambiar tenant
              </Link>
            </>
          ) : (
            <Link
              href="/login"
              onClick={onNavigate}
              className="block rounded-md py-2 text-center text-sm font-medium text-violet-400 hover:text-violet-300"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
