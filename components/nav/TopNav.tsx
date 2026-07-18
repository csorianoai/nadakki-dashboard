"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Car, Menu, Moon, Sparkles, Star, Sun, X } from "lucide-react";
import { MatchMyApprovalModal } from "@/components/nav/MatchMyApprovalModal";
import { HoverTooltip } from "@/components/ui/HoverTooltip";
import { useTheme } from "@/components/system/ThemeProvider";
import { useTenant } from "@/components/system/TenantProvider";
import { useShopper } from "@/components/shopper/ShopperProvider";
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

const MATCH_TOOLTIP =
  "Aplica una vez, recibe ofertas de Credicefi + Banco Piloto RD. Compara aprobaciones reales antes de elegir vehículo.";

export function TopNav() {
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();
  const { tenant, config, setTenant } = useTenant();
  const { newMatchCount, profile } = useShopper();
  const [matchOpen, setMatchOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header
        className="sticky top-0 z-40 border-b border-nk-border backdrop-blur-[14px]"
        style={{ background: "color-mix(in srgb, var(--surface) 88%, transparent)" }}
      >
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-3 px-[clamp(16px,3vw,22px)] py-3">
          <Link href="/autos" className="flex min-h-11 min-w-11 items-center gap-3">
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

          <nav className="hidden items-center gap-1 md:flex" aria-label="Principal">
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
                    "inline-flex min-h-11 items-center rounded-[11px] px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2",
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

          <div className="flex items-center justify-end gap-2">
            <Select value={tenant} onValueChange={(v) => setTenant(v as TenantSlug)}>
              <SelectTrigger
                className="hidden h-11 min-h-11 w-[min(180px,42vw)] min-w-[140px] sm:flex"
                aria-label="Tenant"
              >
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
              className="min-h-11 min-w-11"
              onClick={toggleTheme}
              aria-label={theme === "light" ? "Modo oscuro" : "Modo claro"}
            >
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>

            <HoverTooltip text={MATCH_TOOLTIP}>
              <button
                type="button"
                onClick={() => setMatchOpen(true)}
                className="hidden min-h-11 items-center gap-1.5 rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand transition hover:brightness-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 sm:inline-flex"
              >
                <Star className="h-4 w-4 shrink-0" aria-hidden />
                <span className="hidden lg:inline">Match My Approval</span>
              </button>
            </HoverTooltip>

            <Link
              href="/autos/mi-shopper"
              className="relative hidden min-h-11 items-center gap-1.5 rounded-full border border-nk-border px-3 py-1.5 text-sm font-semibold text-nk-fg transition hover:bg-nk-surface-2 sm:inline-flex"
              aria-label={
                profile
                  ? `Mi AI Personal Shopper${newMatchCount ? `, ${newMatchCount} nuevos` : ""}`
                  : "Activar AI Personal Shopper"
              }
            >
              <Sparkles className="h-4 w-4 shrink-0 text-brand" aria-hidden />
              <span className="hidden lg:inline">Mi Shopper</span>
              {newMatchCount > 0 ? (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-bold text-white">
                  {newMatchCount > 9 ? "9+" : newMatchCount}
                </span>
              ) : null}
            </Link>

            <span
              className="hidden h-11 w-11 items-center justify-center rounded-full bg-nk-surface-3 text-xs font-bold text-nk-fg sm:inline-flex"
              aria-label="Usuario JR"
            >
              JR
            </span>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="min-h-11 min-w-11 md:hidden"
              aria-label={mobileOpen ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={mobileOpen}
              onClick={() => setMobileOpen((o) => !o)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {mobileOpen ? (
          <nav
            className="border-t border-nk-border bg-nk-surface px-4 py-3 md:hidden"
            aria-label="Menú móvil"
          >
            <ul className="space-y-1">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex min-h-11 items-center rounded-r-sm px-3 text-sm font-medium text-nk-fg hover:bg-nk-surface-2"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/autos/mi-shopper"
                  onClick={() => setMobileOpen(false)}
                  className="flex min-h-11 items-center gap-2 rounded-r-sm px-3 text-sm font-medium text-nk-fg hover:bg-nk-surface-2"
                >
                  <Sparkles className="h-4 w-4 text-brand" />
                  Mi AI Shopper
                  {newMatchCount > 0 ? (
                    <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-white">
                      {newMatchCount}
                    </span>
                  ) : null}
                </Link>
              </li>
            </ul>
          </nav>
        ) : null}
      </header>

      <MatchMyApprovalModal open={matchOpen} onOpenChange={setMatchOpen} />
    </>
  );
}
