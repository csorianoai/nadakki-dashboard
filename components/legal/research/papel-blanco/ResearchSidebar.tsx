"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Briefcase,
  Gavel,
  Search,
  FileText,
  BookOpen,
  History,
  ScrollText,
  Settings,
  Plus,
} from "lucide-react";

const WORK_LINKS = [
  { href: "/legal", label: "Inicio", icon: Home },
  { href: "/legal/cases", label: "Expedientes", icon: Briefcase },
  { href: "/legal/audiencias", label: "Audiencias", icon: Gavel },
  { href: "/legal/research", label: "Investigación", icon: Search },
  { href: "/legal/contracts", label: "Contratos", icon: FileText },
  { href: "/legal/library", label: "Biblioteca", icon: BookOpen },
  { href: "/legal/strategies/historical", label: "Estrategias históricas", icon: History },
] as const;

const ADMIN_LINKS = [
  { href: "/legal/audit", label: "Auditoría", icon: ScrollText },
  { href: "/legal/config", label: "Configuración", icon: Settings },
] as const;

type Props = {
  tenantLabel: string;
};

export function ResearchSidebar({ tenantLabel }: Props) {
  const pathname = usePathname();

  return (
    <aside className="lr-sidebar" data-noprint aria-label="Navegación Legal Hub">
      <div className="lr-sidebar-brand">
        <h2>Legal Hub</h2>
        <p>{tenantLabel}</p>
      </div>

      <Link href="/legal/cases/new" className="lr-btn-nuevo">
        <Plus size={16} strokeWidth={1.9} aria-hidden />
        Nuevo expediente
      </Link>

      <nav aria-label="Trabajo">
        {WORK_LINKS.map(({ href, label, icon: Icon }) => {
          const active =
            label === "Investigación"
              ? pathname.startsWith("/legal/research")
              : href === "/legal"
                ? pathname === "/legal"
                : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href + label}
              href={href}
              className={`lr-nav-item${active ? " lr-nav-item--active" : ""}`}
            >
              <Icon size={16} strokeWidth={1.9} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="lr-nav-divider" role="presentation" />

      <nav aria-label="Administrativo">
        {ADMIN_LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={`lr-nav-item lr-nav-item--admin${active ? " lr-nav-item--active" : ""}`}
            >
              <Icon size={16} strokeWidth={1.9} aria-hidden />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
