"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, Megaphone, Scale, Settings, Shield } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useRBAC } from "@/hooks/useRBAC";
import { cn } from "@/lib/utils";

export type ForgeGlobalCoresSidebarProps = {
  mobileOpen: boolean;
  onNavigate?: () => void;
};

type CoreNav = {
  id: string;
  coreMatchers: string[];
  href: string;
  label: string;
  Icon: typeof Landmark;
};

const CORE_NAV: CoreNav[] = [
  { id: "credit", coreMatchers: ["credit"], href: "/credit-hub", label: "Credit", Icon: Landmark },
  { id: "legal", coreMatchers: ["legal"], href: "/legal-hub", label: "Legal", Icon: Scale },
  { id: "marketing", coreMatchers: ["marketing"], href: "/marketing-hub", label: "Marketing", Icon: Megaphone },
  { id: "sic", coreMatchers: ["sic", "platform"], href: "/sic", label: "SIC", Icon: Shield },
];

const ADMIN_ENTRY: CoreNav = {
  id: "admin",
  coreMatchers: [],
  href: "/admin",
  label: "Admin",
  Icon: Settings,
};

function userCanAccessAdmin(allRoles: { core_name: string; role_key: string }[]): boolean {
  return allRoles.some(
    (r) =>
      r.role_key === "tenant_admin" ||
      r.role_key === "platform_superadmin" ||
      (r.core_name === "platform" && r.role_key === "support_agent"),
  );
}

/**
 * Show a core if the user has a matching RBAC role, or the tenant lists that
 * core in `subscribed_cores`, or there is no subscription list (show all for
 * backward compatibility / local dev).
 */
function hasCoreAccess(
  core: CoreNav,
  allRoles: { core_name: string }[],
  subscribed: string[] | undefined,
): boolean {
  const roleHit = allRoles.some((r) => core.coreMatchers.includes(r.core_name));
  if (roleHit) return true;

  const hasSubscriptionList = subscribed && subscribed.length > 0;

  const subHit = (subscribed ?? []).some((c) => core.coreMatchers.includes(c));

  /* No subscription telemetry → permissive defaults; route guards enforce access. */
  if (!hasSubscriptionList) return true;

  return subHit;
}

function isCoreActive(id: string, pathname: string | null): boolean {
  if (!pathname) return false;
  if (id === "credit") return pathname.startsWith("/credit-hub");
  if (id === "legal") return pathname.startsWith("/legal") || pathname.startsWith("/legal-hub");
  if (id === "marketing") return pathname.startsWith("/marketing") || pathname.startsWith("/marketing-hub");
  if (id === "sic") return pathname.startsWith("/sic");
  if (id === "admin") return pathname.startsWith("/admin");
  return false;
}

export function ForgeGlobalCoresSidebar({ mobileOpen, onNavigate }: ForgeGlobalCoresSidebarProps) {
  const pathname = usePathname();
  const { tenant } = useAuth();
  const { allRoles } = useRBAC();

  const visiblePrimary = useMemo(
    () => CORE_NAV.filter((c) => hasCoreAccess(c, allRoles, tenant?.subscribed_cores)),
    [allRoles, tenant?.subscribed_cores],
  );

  const showAdmin = userCanAccessAdmin(allRoles);

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
          "fixed inset-y-0 left-0 z-50 flex w-56 shrink-0 flex-col border-r border-forgeGray-200 bg-forgeSurface-card transition-transform motion-reduce:transition-none lg:static lg:z-auto lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
        aria-label="Product cores"
      >
        <div className="border-b border-forgeGray-200 px-4 py-3">
          <p className="font-display text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-500">
            Cores
          </p>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2" aria-label="Core navigation">
          {visiblePrimary.map(({ id, href, label, Icon }) => {
            const active = isCoreActive(id, pathname);
            return (
              <Link
                key={id}
                href={href}
                onClick={onNavigate}
                className={cn(
                  "flex min-h-12 items-center gap-2 rounded-forge-sm px-3 py-3 text-forge-sm font-medium transition-colors duration-[var(--forge-duration-fast)]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
                  active
                    ? "bg-forgeSurface-sunken text-forgeBrand-700"
                    : "text-forgeGray-700 hover:bg-forgeSurface-sunken hover:text-forgeGray-900",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 text-forgeGray-500" aria-hidden />
                {label}
              </Link>
            );
          })}
          {showAdmin ? (
            <Link
              href={ADMIN_ENTRY.href}
              onClick={onNavigate}
              className={cn(
                "flex min-h-12 items-center gap-2 rounded-forge-sm px-3 py-3 text-forge-sm font-medium transition-colors duration-[var(--forge-duration-fast)]",
                "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
                isCoreActive("admin", pathname)
                  ? "bg-forgeSurface-sunken text-forgeBrand-700"
                  : "text-forgeGray-700 hover:bg-forgeSurface-sunken hover:text-forgeGray-900",
              )}
              aria-current={isCoreActive("admin", pathname) ? "page" : undefined}
            >
              <ADMIN_ENTRY.Icon className="h-4 w-4 shrink-0 text-forgeGray-500" aria-hidden />
              {ADMIN_ENTRY.label}
            </Link>
          ) : null}
          {showAdmin ? (
            <Link
              href="/admin/branding"
              onClick={onNavigate}
              className={cn(
                "ml-6 flex min-h-10 items-center rounded-forge-sm px-2 py-2 text-forge-xs font-medium transition-colors duration-[var(--forge-duration-fast)]",
                pathname?.startsWith("/admin/branding")
                  ? "text-forgeBrand-700"
                  : "text-forgeGray-600 hover:bg-forgeSurface-sunken hover:text-forgeGray-900",
              )}
            >
              Institution branding
            </Link>
          ) : null}
        </nav>
      </aside>
    </>
  );
}
