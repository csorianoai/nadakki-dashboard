"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useCockpit } from "../context";

type TenantOption = { id: string; name: string };

export function CockpitTopbar() {
  const { tenantFilter, setTenantFilter, isTenantAdminOnly } = useCockpit();
  const [tenants, setTenants] = useState<TenantOption[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTenants = useCallback(async () => {
    setLoading(true);
    try {
      const { platformFetch } = await import("@/lib/platformApi");
      const res = await platformFetch<{ tenants?: TenantOption[] }>("/tenant-admin/v1/tenants");
      setTenants(
        (res.tenants ?? []).map((t) => ({
          id: String((t as TenantOption).id),
          name: String((t as TenantOption).name ?? (t as TenantOption).id),
        })),
      );
    } catch {
      setTenants([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isTenantAdminOnly) void loadTenants();
  }, [isTenantAdminOnly, loadTenants]);

  return (
    <header
      className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--ch-line)] bg-[var(--ch-surface)] px-4 py-3"
      data-testid="cockpit-topbar"
    >
      <div>
        <p className="ch-eyebrow">Network Cockpit</p>
        <h1 className="ch-serif text-xl font-semibold">Operador de red</h1>
      </div>
      <div className="flex items-center gap-2">
        <label htmlFor="cockpit-tenant-filter" className="text-xs text-[var(--ch-text-3)]">
          Alcance
        </label>
        <select
          id="cockpit-tenant-filter"
          className="ch-input min-w-[180px] text-sm"
          value={tenantFilter ?? ""}
          disabled={isTenantAdminOnly || loading}
          onChange={(e) => setTenantFilter(e.target.value ? e.target.value : null)}
          data-testid="cockpit-tenant-select"
        >
          <option value="">Toda la red</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}

const NAV = [
  { href: "/credit-hub/admin", label: "Nivel 1 — Red", level: "network" },
  { href: "/credit-hub/admin/credit", label: "Nivel 2 — Credit Hub", level: "credit" },
  { href: "/credit-hub/admin/platform", label: "Nivel 3 — Plataforma", level: "platform" },
] as const;

export function CockpitNav() {
  const pathname = usePathname();
  const { isTenantAdminOnly } = useCockpit();

  return (
    <nav className="flex flex-wrap gap-1 border-b border-[var(--ch-line)] px-4 py-2" aria-label="Niveles cockpit">
      {NAV.map((item) => {
        if (isTenantAdminOnly && item.level === "network") return null;
        const active = pathname === item.href || (item.href !== "/credit-hub/admin" && pathname?.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded px-3 py-1.5 text-sm ${active ? "bg-[var(--ch-persona-soft)] font-semibold text-[var(--ch-persona)]" : "text-[var(--ch-text-2)] hover:bg-[var(--ch-surface-2)]"}`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function CockpitBreadcrumb() {
  const pathname = usePathname();
  const crumbs = [
    { label: "Credit Hub", href: "/credit-hub" },
    { label: "Admin", href: "/credit-hub/admin" },
  ];
  if (pathname?.includes("/credit")) crumbs.push({ label: "Credit Hub", href: "/credit-hub/admin/credit" });
  if (pathname?.includes("/platform")) crumbs.push({ label: "Plataforma", href: "/credit-hub/admin/platform" });

  return (
    <ol className="flex flex-wrap gap-1 px-4 py-2 text-xs text-[var(--ch-text-3)]" aria-label="Breadcrumb">
      {crumbs.map((c, i) => (
        <li key={c.href} className="flex items-center gap-1">
          {i > 0 ? <span aria-hidden>/</span> : null}
          <Link href={c.href} className="hover:text-[var(--ch-text)]">
            {c.label}
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function CockpitShell({ children, level }: { children: ReactNode; level?: "network" | "credit" | "platform" }) {
  return (
    <div className="credit-hub-forge min-h-0 flex-1" data-testid="cockpit-shell" data-level={level}>
      <CockpitTopbar />
      <CockpitBreadcrumb />
      <CockpitNav />
      <main id="cockpit-main" className="mx-auto max-w-6xl space-y-4 p-4 pb-8">
        {children}
      </main>
    </div>
  );
}
