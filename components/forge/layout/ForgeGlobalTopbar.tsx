"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { TenantSwitcher } from "@/components/forge/auth/TenantSwitcher";
import { UserMenu } from "@/components/forge/auth/UserMenu";
import { IconButton } from "@/components/forge/ui/IconButton";
import { useTenant as useCreditHubTenant } from "@/lib/credit-hub/hooks/useTenant";
import { useTenantBranding } from "@/lib/credit-hub/hooks/useTenantBranding";
import { useForgeCommandPaletteOptional } from "./ForgeCommandPaletteContext";
import { Topbar } from "./Topbar";

export interface ForgeGlobalTopbarProps {
  onMenuClick: () => void;
}

function useGlobalTopbarTitle(pathname: string | null): string {
  if (!pathname) return "NADAKKI";
  if (pathname.startsWith("/credit-hub")) return "Credit Hub";
  if (pathname.startsWith("/legal")) return "Legal Intelligence";
  if (pathname.startsWith("/marketing")) return "Marketing";
  if (pathname.startsWith("/sic")) return "SIC";
  return "NADAKKI";
}

export function ForgeGlobalTopbar({ onMenuClick }: ForgeGlobalTopbarProps) {
  const pathname = usePathname();
  const palette = useForgeCommandPaletteOptional();
  const { tenantSlug } = useCreditHubTenant();
  const onCreditHub = pathname?.startsWith("/credit-hub") ?? false;
  const { data: branding } = useTenantBranding(onCreditHub ? tenantSlug : null);

  const baseTitle = useGlobalTopbarTitle(pathname ?? null);
  const title =
    onCreditHub && branding?.display_name?.trim() ? branding.display_name.trim() : baseTitle;

  const showSearch = onCreditHub && Boolean(palette);

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
        Nadakki
      </Link>
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
