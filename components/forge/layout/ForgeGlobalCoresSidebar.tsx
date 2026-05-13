"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
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

export type ForgeGlobalCoresSidebarProps = {
  mobileOpen: boolean;
  onNavigate?: () => void;
};

const STORAGE_KEY = "forge-global-sidebar-expanded-v1";

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
      return "bg-forgeBrand-100 text-forgeBrand-800 border border-forgeBrand-200";
    case "BETA":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "POPULAR":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    default:
      return "bg-forgeGray-100 text-forgeGray-700";
  }
}

export function ForgeGlobalCoresSidebar({ mobileOpen, onNavigate }: ForgeGlobalCoresSidebarProps) {
  const pathname = usePathname();
  const { tenant, allRoles } = useAuth();
  const showAdmin = userCanAccessAdminNav(allRoles);

  const visibleSections = useMemo(
    () => filterSectionsForUser(NAV_SECTIONS, allRoles, tenant?.subscribed_cores, showAdmin),
    [allRoles, showAdmin, tenant?.subscribed_cores],
  );

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
      /* ignore quota */
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
          "ml-auto shrink-0 rounded-forge-sm px-1.5 py-px text-[10px] font-semibold uppercase leading-tight tracking-wide",
          badgeClasses(b),
        )}
      >
        {b}
      </span>
    ) : null;

  const renderLink = (item: NavItem, depth: number) => {
    if (!item.href) return null;
    const active = isHrefActive(item.href, pathname);
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={cn(
          "flex min-h-9 items-center gap-2 rounded-forge-sm py-1.5 pr-2 text-forge-xs font-medium transition-colors duration-[var(--forge-duration-fast)]",
          "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
          active
            ? "bg-forgeSurface-sunken text-forgeBrand-700"
            : "text-forgeGray-700 hover:bg-forgeSurface-sunken hover:text-forgeGray-900",
        )}
        style={{ paddingLeft: 10 + depth * 12 }}
        aria-current={active ? "page" : undefined}
      >
        {item.icon ? (
          <item.icon className="h-3.5 w-3.5 shrink-0 text-forgeGray-500" aria-hidden />
        ) : (
          <span className="h-3.5 w-3.5 shrink-0" aria-hidden />
        )}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {renderBadge(item.badge)}
      </Link>
    );
  };

  const renderFolder = (item: NavItem, depth: number) => {
    const open = expanded[item.id] ?? false;
    const hasKids = Boolean(item.children?.length);
    if (!hasKids) return renderLink(item, depth);

    return (
      <div className="flex flex-col" key={item.id}>
        <button
          type="button"
          onClick={() => toggle(item.id)}
          className={cn(
            "flex min-h-9 w-full items-center gap-1 rounded-forge-sm py-1.5 pr-2 text-left text-forge-xs font-semibold text-forgeGray-800 transition-colors duration-[var(--forge-duration-fast)]",
            "hover:bg-forgeSurface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
          )}
          style={{ paddingLeft: 6 + depth * 12 }}
          aria-expanded={open}
        >
          <ChevronRight
            className={cn("h-3.5 w-3.5 shrink-0 text-forgeGray-500 transition-transform duration-200", open && "rotate-90")}
            aria-hidden
          />
          {item.icon ? <item.icon className="h-3.5 w-3.5 shrink-0 text-forgeGray-500" aria-hidden /> : null}
          <span className="min-w-0 flex-1 truncate">{item.label}</span>
          {renderBadge(item.badge)}
        </button>
        <div
          className={cn(
            "overflow-hidden transition-[max-height] duration-200 ease-out motion-reduce:transition-none",
            open ? "max-h-[4000px] opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="ml-0 space-y-0.5 pt-0.5">{item.children!.map((ch) => renderNavItem(ch, depth + 1))}</div>
        </div>
      </div>
    );
  };

  const renderNavItem = (item: NavItem, depth: number): ReactNode => {
    if (item.children && item.children.length > 0) {
      return <div key={item.id}>{renderFolder(item, depth)}</div>;
    }
    return <div key={item.id}>{renderLink(item, depth)}</div>;
  };

  const renderSection = (section: NavSection) => {
    const open = expanded[section.id] ?? false;
    const SectionIcon = section.icon;
    return (
      <div key={section.id} className="flex flex-col border-b border-forgeGray-100 last:border-b-0">
        <button
          type="button"
          onClick={() => toggle(section.id)}
          className={cn(
            "flex w-full items-center gap-2 rounded-forge-sm px-2 py-2.5 text-left text-forge-xs font-bold uppercase tracking-wide text-forgeGray-600 transition-colors duration-[var(--forge-duration-fast)]",
            "hover:bg-forgeSurface-sunken focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
          )}
          aria-expanded={open}
        >
          <ChevronRight
            className={cn("h-4 w-4 shrink-0 text-forgeGray-500 transition-transform duration-200", open && "rotate-90")}
            aria-hidden
          />
          <SectionIcon className="h-4 w-4 shrink-0 text-forgeGray-500" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{section.label}</span>
        </button>
        <div
          className={cn(
            "overflow-hidden transition-[max-height] duration-200 ease-out motion-reduce:transition-none",
            open ? "max-h-[8000px] opacity-100" : "max-h-0 opacity-0",
          )}
        >
          <div className="space-y-0.5 pb-3 pl-1">{section.children.map((item) => renderNavItem(item, 0))}</div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        role="presentation"
        className={cn(
          "fixed inset-0 z-40 bg-forgeSurface-overlay transition-opacity lg:hidden",
          mobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
        )}
        aria-hidden={!mobileOpen}
        onClick={onNavigate}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-[18rem] shrink-0 flex-col border-r border-forgeGray-200 bg-forgeSurface-card transition-transform motion-reduce:transition-none lg:static lg:z-auto lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        aria-label="Navegación principal"
      >
        <div className="border-b border-forgeGray-200 px-3 py-3">
          <p className="font-display text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">Producto</p>
          <p className="mt-0.5 text-[10px] leading-snug text-forgeGray-500">
            Cores, workflows y administración ({visibleSections.length} secciones)
          </p>
        </div>
        <nav className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden" aria-label="Navegación por módulos">
          {visibleSections.map(renderSection)}
        </nav>
      </aside>
    </>
  );
}
