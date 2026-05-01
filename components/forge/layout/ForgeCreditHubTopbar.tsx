"use client";

import { Search } from "lucide-react";
import { usePersona } from "@/components/credit-hub/system/PersonaProvider";
import { useTenant as useDashboardTenant } from "@/contexts/TenantContext";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { IconButton } from "@/components/forge/ui/IconButton";
import { personaLabel } from "@/lib/credit-hub/design/persona";
import { useForgeCommandPalette } from "./ForgeCommandPaletteContext";
import { Topbar } from "./Topbar";

export function ForgeCreditHubTopbar() {
  const persona = usePersona();
  const { settings } = useDashboardTenant();
  const { tenantConfig } = useTenantConfig();
  const { toggle } = useForgeCommandPalette();
  const fromBanking = tenantConfig.institution_name?.trim();
  const fromSettings = settings.name?.trim() && settings.name !== "—" ? settings.name.trim() : "";
  const title = fromBanking || fromSettings || "Credit Hub";
  const leading = (
    <p className="text-forge-xs font-medium uppercase tracking-wide text-forgeInk-500">{personaLabel(persona)} portal</p>
  );
  const actions = (
    <IconButton type="button" variant="subtle" aria-label="Open command palette" onClick={toggle}>
      <Search aria-hidden />
    </IconButton>
  );

  return <Topbar title={title} leading={leading} actions={actions} />;
}
