"use client";

import { type ReactNode } from "react";
import { CHAdminAccessGuard } from "@/components/credit-hub/system/CHAdminAccessGuard";
import { CockpitProvider } from "@/lib/cockpit/context";
import { CockpitShell } from "@/lib/cockpit/components/CockpitShell";

export default function CockpitAdminLayout({ children }: { children: ReactNode }) {
  return (
    <CHAdminAccessGuard>
      <CockpitProvider>
        <CockpitShell>{children}</CockpitShell>
      </CockpitProvider>
    </CHAdminAccessGuard>
  );
}
