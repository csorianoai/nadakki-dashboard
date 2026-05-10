"use client";

import { Topbar } from "./Topbar";
import { useTenant } from "@/contexts/TenantContext";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";

export type ForgeAppTopbarModule = "legal";

export interface ForgeAppTopbarProps {
  module: ForgeAppTopbarModule;
}

export function ForgeAppTopbar({ module }: ForgeAppTopbarProps) {
  const { settings } = useTenant();
  const { tenantConfig } = useTenantConfig();
  const fromBanking = tenantConfig.institution_name?.trim();
  const fromSettings = settings.name?.trim() && settings.name !== "—" ? settings.name.trim() : "";
  const org = fromBanking || fromSettings || "Tenant";

  if (module === "legal") {
    return (
      <Topbar
        title={`${org} — Legal Intelligence`}
        leading={
          <p className="text-forge-xs font-medium uppercase tracking-wide text-forgeGray-500">Legal module</p>
        }
      />
    );
  }

  return <Topbar title={org} />;
}
