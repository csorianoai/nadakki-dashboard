"use client";

import { CreditKpisPanel } from "./CreditKpisPanel";
import { CreditQueuePanel } from "./CreditQueuePanel";
import { CreditSidePanels } from "./CreditSidePanels";

export function CreditCockpitNivel2() {
  return (
    <div className="space-y-4" data-testid="cockpit-nivel2">
      <CreditKpisPanel />
      <CreditQueuePanel />
      <CreditSidePanels />
    </div>
  );
}
