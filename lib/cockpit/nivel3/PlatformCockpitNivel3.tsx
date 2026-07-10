"use client";

import { TenantsPanel } from "./TenantsPanel";
import { UsersPanel } from "./UsersPanel";
import { SubscriptionsPanel } from "./SubscriptionsPanel";

export function PlatformCockpitNivel3() {
  return (
    <div className="space-y-4" data-testid="cockpit-nivel3">
      <TenantsPanel />
      <UsersPanel />
      <SubscriptionsPanel />
    </div>
  );
}
