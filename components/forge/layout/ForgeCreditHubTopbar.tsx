"use client";

import { usePersona } from "@/components/credit-hub/system/PersonaProvider";
import { useTenant as useDashboardTenant } from "@/contexts/TenantContext";
import { personaLabel } from "@/lib/credit-hub/design/persona";
import { Topbar } from "./Topbar";

export function ForgeCreditHubTopbar() {
  const persona = usePersona();
  const { settings } = useDashboardTenant();
  const title = settings.name?.trim() && settings.name !== "—" ? settings.name : "Credit Hub";
  const leading = (
    <p className="text-forge-xs font-medium uppercase tracking-wide text-forgeInk-500">{personaLabel(persona)} portal</p>
  );

  return <Topbar title={title} leading={leading} />;
}
