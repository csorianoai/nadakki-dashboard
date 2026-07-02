"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";
import { resolveVisiblePlatformTitle } from "@/lib/white-label/brand-display";
import { MONETIZACION_NAV } from "./nav-routes";

type Props = {
  mobileOpen?: boolean;
  onNavigate?: () => void;
};

export function NavRail({ mobileOpen, onNavigate }: Props) {
  const pathname = usePathname();
  const { tenant } = useAuth();
  const { data: branding } = useTenantBranding();
  const displayName = resolveVisiblePlatformTitle(branding, tenant);

  return (
    <nav className={`fm-nav${mobileOpen ? " fm-nav--open" : ""}`} aria-label="Monetización">
      <div className="fm-nav-brand">
        <h2>Forge</h2>
        <p>Credit Hub · {displayName}</p>
      </div>
      <p className="fm-nav-group-label">Monetización</p>
      {MONETIZACION_NAV.map(({ id, href, label, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={id}
            href={href}
            className={`fm-nav-item${active ? " fm-nav-item--active" : ""}`}
            onClick={onNavigate}
          >
            <Icon size={16} strokeWidth={1.9} aria-hidden />
            <span className="fm-nav-item-label">{label}</span>
            {active ? <span className="fm-nav-item-dot" aria-hidden /> : null}
          </Link>
        );
      })}
    </nav>
  );
}
