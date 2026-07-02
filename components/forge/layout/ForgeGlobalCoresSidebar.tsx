"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, PanelLeftClose, PanelLeft } from "lucide-react";
import type { UserInfo } from "@/lib/api/auth-v2";
import { useAuth } from "@/hooks/useAuth";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";
import { brandInitial, resolveVisiblePlatformTitle } from "@/lib/white-label/brand-display";
import { cn } from "@/lib/utils";
import {
  LARGE_CORE_LEAF_THRESHOLD,
  NAV_SECTIONS,
  type NavBadge,
  type NavItem,
  type NavSection,
  collectExpandIdsForPath,
  countNavLeaves,
  filterSectionsForUser,
  getEmptyCoreMessage,
  getEmptyCoreReason,
  isHrefActive,
  userCanAccessAdminNav,
} from "./forge-global-sidebar-nav";
import { getSidebarTheme, roleAccentClasses } from "./forge-sidebar-core-themes";
import { ProyectosFinanzasSidebarLinks } from "./ProyectosFinanzasSidebarLinks";

export type ForgeGlobalCoresSidebarProps = {
  mobileOpen: boolean;
  onNavigate?: () => void;
};

const STORAGE_KEY = "forge-global-sidebar-expanded-v2";
const STORAGE_KEY_V1 = "forge-global-sidebar-expanded-v1";
const SIDEBAR_COLLAPSED_KEY = "nadakki-sidebar-collapsed";

const KNOWN_CORE_IDS = new Set(NAV_SECTIONS.map((s) => s.id));

function migrateV1ToV2(): Record<string, boolean> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_V1);
    if (!raw) return null;

    const v1 = JSON.parse(raw) as Record<string, boolean>;
    if (typeof v1 !== "object" || v1 === null) return null;

    const v2: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(v1)) {
      if (typeof value !== "boolean") continue;
      if (key === "workflows") {
        if (value) {
          v2["marketing-hub"] = true;
          v2["m-workflows"] = true;
        }
        continue;
      }
      if (KNOWN_CORE_IDS.has(key) || key.includes("-")) {
        v2[key] = value;
      }
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(v2));
    localStorage.removeItem(STORAGE_KEY_V1);

    if (process.env.NODE_ENV === "development") {
      console.info("[sidebar] Migrated localStorage v1 → v2", Object.keys(v2).length, "keys");
    }
    return v2;
  } catch {
    return null;
  }
}

function loadExpanded(): Record<string, boolean> {
  if (typeof window === "undefined") return {};
  try {
    const rawV2 = localStorage.getItem(STORAGE_KEY);
    if (rawV2) {
      const parsed = JSON.parse(rawV2) as Record<string, boolean>;
      if (typeof parsed === "object" && parsed !== null) return parsed;
    }
    return migrateV1ToV2() ?? {};
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

function SidebarBrand({ onNavigate, collapsed }: { onNavigate?: () => void; collapsed?: boolean }) {
  const { tenant } = useAuth();
  const { data: branding, isPending } = useTenantBranding();
  const displayName = resolveVisiblePlatformTitle(branding, tenant);
  return (
    <div className={cn("border-b border-zinc-800 py-4", collapsed ? "px-2" : "px-3")}>
      <Link
        href="/"
        onClick={onNavigate}
        className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
        title={collapsed ? displayName : undefined}
      >
        {branding?.logo_url && !isPending ? (
          <span className={cn("inline-flex items-center overflow-hidden", collapsed ? "h-8 w-full justify-center" : "h-9 max-w-[10rem]")}>
            {/* eslint-disable-next-line @next/next/no-img-element -- tenant-hosted logo */}
            <img src={branding.logo_url} alt="" className={cn(collapsed ? "max-h-7 w-auto" : "max-h-9 w-auto", "object-contain")} />
          </span>
        ) : isPending ? (
          <div className={cn("animate-pulse rounded bg-zinc-800/80", collapsed ? "mx-auto h-8 w-8" : "h-8 w-24")} />
        ) : collapsed ? (
          <span className="flex h-8 w-full items-center justify-center text-base font-bold text-violet-400">{brandInitial(displayName)}</span>
        ) : (
          <span className="block text-sm font-semibold tracking-tight text-zinc-100">{displayName}</span>
        )}
      </Link>
      {!collapsed && <p className="mt-1.5 text-[10px] font-medium text-zinc-500">Suite operativa</p>}
    </div>
  );
}

function NavGroupHeader({ label }: { label: string }) {
  return (
    <div className="px-6 pb-0.5 pt-2 first:pt-1">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">{label}</p>
    </div>
  );
}

function sectionHasActiveRoute(section: NavSection, pathname: string | null): boolean {
  if (!pathname) return false;
  function walk(it: NavItem): boolean {
    if (it.href && isHrefActive(it.href, pathname)) return true;
    return it.children?.some(walk) ?? false;
  }
  return section.children.some(walk);
}

export function ForgeGlobalCoresSidebar({ mobileOpen, onNavigate }: ForgeGlobalCoresSidebarProps) {
  const pathname = usePathname();
  const { tenant, allRoles, user, activeRole, isAuthenticated } = useAuth();
  const showAdmin = userCanAccessAdminNav(allRoles);

  const visibleSections = useMemo(
    () => filterSectionsForUser(NAV_SECTIONS, allRoles, tenant?.subscribed_cores, showAdmin),
    [allRoles, showAdmin, tenant?.subscribed_cores],
  );

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setExpanded(loadExpanded());
    setHydrated(true);
    try {
      const saved = window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY);
      if (saved === "true") setCollapsed(true);
    } catch { /* ignore */ }
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
    if (!hydrated) return;
    const auto = collectExpandIdsForPath(visibleSections, pathname ?? null);
    setExpanded((prev) => {
      const next = { ...prev };
      auto.forEach((id) => {
        next[id] = true;
      });
      return next;
    });
  }, [pathname, visibleSections, hydrated]);

  const toggle = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try { window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next)); } catch { /* ignore */ }
      return next;
    });
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

  const renderLink = (item: NavItem, depth: number) => {
    if (!item.href) return null;
    const active = isHrefActive(item.href, pathname);
    const isSubItem = depth >= 1;
    return (
      <Link
        key={item.id}
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex min-h-8 items-center gap-2 rounded-md py-1.5 pr-3 transition-colors duration-150",
          isSubItem ? "pl-9 text-xs" : "pl-6 text-xs",
          "focus-visible:outline focus-visible:ring-2 focus-visible:ring-violet-500/40",
          active
            ? "border-l-2 border-violet-500 bg-violet-500/5 text-violet-300"
            : "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200",
        )}
        aria-current={active ? "page" : undefined}
      >
        {item.icon ? (
          <item.icon className={cn("h-3.5 w-3.5 shrink-0", active ? "text-violet-300" : "text-zinc-500")} aria-hidden />
        ) : (
          <span className="h-1 w-1 shrink-0 rounded-full bg-zinc-600" aria-hidden />
        )}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {renderBadge(item.badge)}
      </Link>
    );
  };

  const renderFolder = (item: NavItem, depth: number, showGroupHeader: boolean): ReactNode => {
    const open = expanded[item.id] ?? false;
    const hasKids = Boolean(item.children?.length);
    if (!hasKids) return renderLink(item, depth);

    return (
      <div key={item.id} className="flex flex-col">
        {showGroupHeader && item.groupLabel ? <NavGroupHeader label={item.groupLabel} /> : null}
        <button
          type="button"
          onClick={() => toggle(item.id)}
          className={cn(
            "flex min-h-8 w-full items-center gap-2 rounded-md py-1.5 pr-3 text-left text-xs font-medium transition-colors",
            depth >= 1 ? "pl-9" : "pl-6",
            "text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200",
            "focus-visible:outline focus-visible:ring-2 focus-visible:ring-violet-500/40",
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
            className={cn("h-3.5 w-3.5 shrink-0 text-zinc-500 transition-transform duration-200", open && "rotate-90")}
            aria-hidden
          />
        </button>
        <div
          className={cn(
            "overflow-hidden transition-[max-height] duration-200 ease-in-out motion-reduce:transition-none",
            open ? "max-h-[4000px] opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="space-y-0.5">{item.children!.map((ch) => renderNavItem(ch, depth + 1, false))}</div>
        </div>
      </div>
    );
  };

  const renderNavItem = (item: NavItem, depth: number, showGroupHeader: boolean): ReactNode => {
    if (item.children && item.children.length > 0) {
      return renderFolder(item, depth, showGroupHeader);
    }
    return renderLink(item, depth);
  };

  const renderSectionChildren = (section: NavSection) => {
    const useGroupedLayout =
      countNavLeaves(section.children) > LARGE_CORE_LEAF_THRESHOLD ||
      section.children.some((item) => item.groupLabel);

    const items = section.children.map((item) => renderNavItem(item, 0, useGroupedLayout));

    if (section.id === "projects-hub") {
      return (
        <>
          {items}
          <ProyectosFinanzasSidebarLinks onNavigate={onNavigate} />
        </>
      );
    }

    return items;
  };

  const renderCollapsedSection = (section: NavSection) => {
    const theme = getSidebarTheme(section.id);
    const HeaderIcon = theme.Icon;
    const isActive = sectionHasActiveRoute(section, pathname ?? null);
    // Find first leaf href in the section for navigation
    function firstHref(items: NavItem[]): string | undefined {
      for (const item of items) {
        if (item.href) return item.href;
        if (item.children) {
          const found = firstHref(item.children);
          if (found) return found;
        }
      }
      return undefined;
    }
    const href = firstHref(section.children);

    const iconEl = (
      <div
        className={cn(
          "flex h-10 w-10 items-center justify-center rounded-lg transition-colors",
          isActive
            ? "bg-violet-500/15 ring-1 ring-violet-500/30"
            : "hover:bg-zinc-800/60",
        )}
        title={section.label}
      >
        <HeaderIcon className={cn("h-[18px] w-[18px]", isActive ? "text-violet-300" : theme.iconText)} aria-hidden />
      </div>
    );

    return (
      <div key={section.id} className="flex justify-center py-0.5">
        {href ? (
          <Link href={href} onClick={onNavigate} className="rounded-lg focus-visible:outline focus-visible:ring-2 focus-visible:ring-violet-500/40">
            {iconEl}
          </Link>
        ) : (
          <button type="button" onClick={() => { setCollapsed(false); try { window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, "false"); } catch {} toggle(section.id); }}>
            {iconEl}
          </button>
        )}
      </div>
    );
  };

  const renderSection = (section: NavSection) => {
    const open = expanded[section.id] ?? false;
    const theme = getSidebarTheme(section.id);
    const HeaderIcon = theme.Icon;
    const isActive = sectionHasActiveRoute(section, pathname ?? null);
    const emptyCore = section.children.length === 0;
    const emptyMessage = getEmptyCoreMessage(
      getEmptyCoreReason(section, allRoles, tenant?.subscribed_cores, showAdmin),
    );

    return (
      <div key={section.id} className="mb-0.5">
        <button
          type="button"
          onClick={() => toggle(section.id)}
          className={cn(
            "flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-semibold transition-colors duration-150",
            "focus-visible:outline focus-visible:ring-2 focus-visible:ring-violet-500/40",
            isActive
              ? "border-l-2 border-violet-500 bg-violet-500/10 text-violet-300"
              : "border-l-2 border-transparent text-zinc-100 hover:bg-zinc-800/60",
          )}
          aria-expanded={open}
        >
          <HeaderIcon className={cn("h-[18px] w-[18px] shrink-0", theme.iconText)} aria-hidden />
          <span className="min-w-0 flex-1 truncate">{section.label}</span>
          {renderBadge(section.badge)}
          <ChevronRight
            className={cn("h-4 w-4 shrink-0 text-zinc-500 transition-transform duration-200", open && "rotate-90")}
            aria-hidden
          />
        </button>
        <div
          className={cn(
            "overflow-hidden transition-[max-height] duration-200 ease-in-out motion-reduce:transition-none",
            open ? "max-h-[8000px] opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="space-y-0.5 pb-1 pt-0.5">
            {emptyCore ? (
              <p className="px-9 py-2 text-xs italic text-zinc-500">{emptyMessage}</p>
            ) : (
              renderSectionChildren(section)
            )}
          </div>
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
          "fixed inset-y-0 left-0 z-50 flex shrink-0 flex-col border-r border-zinc-800 bg-zinc-950 text-zinc-100 shadow-[4px_0_24px_-4px_rgba(0,0,0,0.45)] transition-[transform,width] duration-200 ease-in-out motion-reduce:transition-none lg:static lg:z-auto lg:translate-x-0 lg:shadow-none",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
          collapsed
            ? "w-80 max-w-[min(100vw,20rem)] lg:w-[68px] lg:max-w-[68px]"
            : "w-80 max-w-[min(100vw,20rem)] lg:max-w-none",
        )}
        aria-label="Navegación principal"
        data-collapsed={collapsed}
      >
        <SidebarBrand onNavigate={onNavigate} collapsed={collapsed} />

        {/* Collapse toggle — desktop only */}
        <div className="hidden border-b border-zinc-800/60 lg:block">
          <button
            type="button"
            onClick={toggleCollapse}
            title={collapsed ? "Expandir sidebar" : "Colapsar sidebar"}
            className={cn(
              "flex w-full items-center gap-2 py-2 text-zinc-500 transition-colors hover:text-zinc-300",
              collapsed ? "justify-center px-2" : "justify-end px-3",
            )}
          >
            {collapsed ? (
              <PanelLeft className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>

        <nav className={cn("flex min-h-0 flex-1 flex-col overflow-y-auto overflow-x-hidden py-2 pb-2", collapsed ? "px-1 items-center" : "px-1")} aria-label="Navegación por módulos">
          {collapsed
            ? visibleSections.map((section) => renderCollapsedSection(section))
            : visibleSections.map((section) => renderSection(section))
          }
        </nav>

        <div className={cn("mt-auto border-t border-zinc-800 bg-zinc-950/95", collapsed ? "p-2" : "p-3")}>
          {isAuthenticated && user ? (
            collapsed ? (
              <div className="flex flex-col items-center gap-2">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-xs font-bold text-zinc-100 ring-2 ring-zinc-800"
                  title={user.email}
                  aria-hidden
                >
                  {userInitials(user)}
                </div>
              </div>
            ) : (
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
            )
          ) : (
            <Link
              href="/login"
              onClick={onNavigate}
              className={cn("block rounded-md text-center font-medium text-violet-400 hover:text-violet-300", collapsed ? "py-1.5 text-xs" : "py-2 text-sm")}
              title={collapsed ? "Iniciar sesión" : undefined}
            >
              {collapsed ? "→" : "Iniciar sesión"}
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
