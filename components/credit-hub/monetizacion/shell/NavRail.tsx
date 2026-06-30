"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MONETIZACION_NAV } from "./nav-routes";

type Props = {
  mobileOpen?: boolean;
  onNavigate?: () => void;
};

export function NavRail({ mobileOpen, onNavigate }: Props) {
  const pathname = usePathname();

  return (
    <nav className={`fm-nav${mobileOpen ? " fm-nav--open" : ""}`} aria-label="Monetización">
      <div className="fm-nav-brand">
        <h2>Forge</h2>
        <p>Monetización · métricas</p>
      </div>
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
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
