"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Car, Moon, Star, Sun } from "lucide-react";
import { useTheme } from "@/components/system/ThemeProvider";
import { useTenant } from "@/components/system/TenantProvider";
import { TENANT_OPTIONS, TENANTS, type TenantSlug } from "@/lib/tenants";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "/autos", label: "Inicio" },
  { href: "/autos/vehiculos", label: "Buscar" },
  { href: "/autos#vender", label: "Vender" },
  { href: "/autos#dealers", label: "Dealers" },
] as const;

export function TopNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { tenant, config, setTenant } = useTenant();

  return (
    <header
      className="sticky top-0 z-40 border-b border-nk-border backdrop-blur-[14px]"
      style={{ background: "color-mix(in srgb, var(--surface) 88%, transparent)" }}
    >
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-[22px] py-3">
        <Link href="/autos" className="flex min-h-[44px] min-w-[44px] items-center gap-3">
          <span
            className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-gradient-to-br from-brand to-brand-2 text-[var(--on-brand)] shadow-nk-sm"
            aria-hidden
          >
            <Car className="h-5 w-5" strokeWidth={2} />
          </span>
          <span className="min-w-0">
            <span className="block font-manrope text-[17px] font-extrabold leading-tight text-nk-fg">
              {config.name}
            </span>
            <span className="block text-[10px] text-nk-fg-subtle">{config.sub}</span>
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-1" aria-label="Principal">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/autos"
                ? pathname === "/autos"
                : pathname?.startsWith(link.href.split("#")[0] ?? "");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "inline-flex min-h-[38px] items-center rounded-[11px] px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-nk-surface-2 font-bold text-nk-fg"
                    : "text-nk-fg-muted hover:bg-nk-surface-2 hover:text-nk-fg",
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <Select value={tenant} onValueChange={(v) => setTenant(v as TenantSlug)}>
            <SelectTrigger className="h-10 w-[min(180px,42vw)] min-w-[140px]" aria-label="Tenant">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TENANT_OPTIONS.map((slug) => (
                <SelectItem key={slug} value={slug}>
                  {TENANTS[slug].name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="icon"
            className="h-[38px] w-[38px] min-h-[38px] min-w-[38px]"
            onClick={toggleTheme}
            aria-label={theme === "light" ? "Modo oscuro" : "Modo claro"}
          >
            {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
          </Button>

          <Link
            href="/autos#comparador"
            className="inline-flex min-h-[38px] items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand transition hover:brightness-105"
          >
            <Star className="h-4 w-4 shrink-0" aria-hidden />
            <span className="hidden sm:inline">Match My Approval</span>
          </Link>

          <span
            className="inline-flex h-[38px] w-[38px] items-center justify-center rounded-full bg-gradient-to-br from-slate-600 to-slate-800 text-xs font-bold text-white"
            aria-label="Usuario JR"
          >
            JR
          </span>
        </div>
      </div>
    </header>
  );
}
