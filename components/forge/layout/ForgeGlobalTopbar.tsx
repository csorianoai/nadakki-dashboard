"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { TenantSwitcher } from "@/components/forge/auth/TenantSwitcher";
import { UserMenu } from "@/components/forge/auth/UserMenu";
import { IconButton } from "@/components/forge/ui/IconButton";
import { Skeleton } from "@/components/forge/ui/Skeleton";
import { useAuth } from "@/hooks/useAuth";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";
import { resolveVisiblePlatformTitle } from "@/lib/white-label/brand-display";
import { useForgeCommandPaletteOptional } from "./ForgeCommandPaletteContext";
import { Topbar } from "./Topbar";

export interface ForgeGlobalTopbarProps {
  onMenuClick: () => void;
}

function useGlobalTopbarFallbackTitle(pathname: string | null): string {
  if (!pathname) return "Inicio";
  if (pathname.startsWith("/credit-hub")) return "Credit Hub";
  if (pathname.startsWith("/legal")) return "Legal Intelligence";
  if (pathname.startsWith("/marketing")) return "Marketing";
  if (pathname.startsWith("/sic")) return "SIC";
  if (pathname.startsWith("/admin/branding")) return "Institution branding";
  if (pathname.startsWith("/admin")) return "Admin";
  return "Inicio";
}

export function ForgeGlobalTopbar({ onMenuClick }: ForgeGlobalTopbarProps) {
  const pathname = usePathname();
  const palette = useForgeCommandPaletteOptional();
  const { tenant } = useAuth();
  const { data: branding, isPending } = useTenantBranding();

  const baseTitle = useGlobalTopbarFallbackTitle(pathname ?? null);
  const brandTitle = resolveVisiblePlatformTitle(branding, tenant);
  const title =
    pathname?.startsWith("/admin/branding")
      ? "Institution branding"
      : branding?.display_name?.trim() || tenant?.display_name?.trim()
        ? brandTitle
        : baseTitle;

  const onCreditHub = pathname?.startsWith("/credit-hub") ?? false;
  const showSearch = onCreditHub && Boolean(palette);

  const logoSlot =
    branding?.logo_url && !isPending ? (
      <span className="inline-flex h-8 w-auto max-w-[120px] items-center overflow-hidden rounded-forge-sm">
        {/* eslint-disable-next-line @next/next/no-img-element -- tenant-hosted logo */}
        <img src={branding.logo_url} alt="" className="max-h-8 w-auto object-contain" />
      </span>
    ) : isPending ? (
      <Skeleton className="h-8 w-8 motion-reduce:animate-none" label="Logo" />
    ) : null;

  const leading = (
    <div className="flex flex-wrap items-center gap-3">
      <IconButton
        type="button"
        variant="subtle"
        className="lg:hidden"
        aria-label="Abrir menú de cores"
        onClick={onMenuClick}
      >
        <Menu aria-hidden className="h-4 w-4" />
      </IconButton>
      <Link
        href="/credit-hub"
        className="font-display text-forge-sm font-semibold uppercase tracking-wide text-forgeBrand-600 hover:text-forgeBrand-700"
      >
        {isPending ? (
          <Skeleton className="inline-block h-4 w-16" label="Marca" />
        ) : (
          brandTitle
        )}
      </Link>
      {logoSlot}
    </div>
  );

  const actions = (
    <div className="flex flex-wrap items-center gap-2">
      {showSearch ? (
        <IconButton
          type="button"
          variant="subtle"
          aria-label="Open command palette"
          onClick={() => palette?.toggle()}
        >
          <Search aria-hidden className="h-4 w-4" />
        </IconButton>
      ) : null}
      <TenantSwitcher />
      <UserMenu />
    </div>
  );

  return <Topbar title={title} leading={leading} actions={actions} />;
}
