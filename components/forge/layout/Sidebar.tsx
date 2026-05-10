"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export interface SidebarNavItem {
  id: string;
  label: string;
  href: string;
  icon?: ReactNode;
  active?: boolean;
}

export interface SidebarProps {
  brand: ReactNode;
  items: SidebarNavItem[];
  footer?: ReactNode;
  className?: string;
}

export function Sidebar({ brand, items, footer, className }: SidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full w-56 shrink-0 flex-col border-r border-forgeGray-200 bg-forgeSurface-card",
        className
      )}
    >
      <div className="border-b border-forgeGray-100 px-4 py-4">{brand}</div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Primary">
        {items.map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className={cn(
              "flex items-center gap-2 rounded-forge-sm px-3 py-2 text-forge-sm font-medium transition-colors duration-[var(--forge-duration-fast)] ease-out",
              "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
              item.active
                ? "bg-forgeSurface-sunken text-forgeBrand-700"
                : "text-forgeGray-700 hover:bg-forgeSurface-sunken hover:text-forgeGray-900"
            )}
            aria-current={item.active ? "page" : undefined}
          >
            {item.icon ? <span className="text-forgeGray-500 [&>svg]:h-4 [&>svg]:w-4">{item.icon}</span> : null}
            {item.label}
          </Link>
        ))}
      </nav>
      {footer ? <div className="border-t border-forgeGray-100 p-3">{footer}</div> : null}
    </aside>
  );
}
