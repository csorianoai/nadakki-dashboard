"use client";

import { ActivityFeed } from "@/lib/cockpit/nivel1/ActivityFeed";
import { AlertsPanel } from "@/lib/cockpit/nivel1/AlertsPanel";
import { CoresGrid } from "@/lib/cockpit/nivel1/CoresGrid";
import { NetworkHealthRow } from "@/lib/cockpit/nivel1/NetworkHealthRow";

export function NetworkCockpitNivel1() {
  return (
    <div className="space-y-4" data-testid="cockpit-nivel1">
      <NetworkHealthRow />
      <CoresGrid />
      <div className="grid gap-4 lg:grid-cols-2">
        <ActivityFeed />
        <AlertsPanel />
      </div>
    </div>
  );
}
