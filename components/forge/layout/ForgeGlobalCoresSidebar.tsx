"use client";

import { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Landmark, Megaphone, Scale, Shield } from "lucide-react";
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
  { id: "legal", coreMatchers: ["legal"], href: "/legal/cases", label: "Legal", Icon: Scale },
  { id: "marketing", coreMatchers: ["marketing"], href: "/marketing", label: "Marketing", Icon: Megaphone },
  { id: "sic", coreMatchers: ["sic", "platform"], href: "/sic/portafolio", label: "SIC", Icon: Shield },
];

function hasCoreAccess(
  core: CoreNav,
  allRoles: { core_name: string }[],
  subscribed: string[] | undefined,
): boolean {
  const roleMatch = allRoles.some((r) => core.coreMatchers.includes(r.core_name));
  const subMatch = (subscribed ?? []).some((c) => core.coreMatchers.includes(c));
  if (roleMatch || subMatch) return true;
  if (allRoles.length === 0 && (!subscribed || subscribed.length === 0)) return true;
  return false;
}

function isCoreActive(id: string, pathname: string | null): boolean {
  if (!pathname) return false;
  if (id === "credit") return pathname.startsWith("/credit-hub");
  if (id === "legal") return pathname.startsWith("/legal");
  if (id === "marketing") return pathname.startsWith("/marketing");
  if (id === "sic") return pathname.startsWith("/sic");
  return false;
}

export function ForgeGlobalCoresSidebar({ mobileOpen, onNavigate }: ForgeGlobalCoresSidebarProps) {
  const pathname = usePathname();
  const { tenant } = useAuth();
  const { allRoles } = useRBAC();

  const visible = useMemo(
    () => CORE_NAV.filter((c) => hasCoreAccess(c, allRoles, tenant?.subscribed_cores)),
    [allRoles, tenant?.subscribed_cores],
  );

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
        <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Core navigation">
          {visible.map(({ id, href, label, Icon }) => {
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
        </nav>
      </aside>
    </>
  );
}
