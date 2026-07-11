"use client";

import { type ReactNode } from "react";
import { CHAdminAccessGuard } from "@/components/credit-hub/system/CHAdminAccessGuard";
import { CockpitProvider } from "@/lib/cockpit/context";
import { CockpitShellLayout } from "@/components/cockpit/CockpitShellLayout";

export default function CockpitSectionLayout({ children }: { children: ReactNode }) {
  return (
    <CHAdminAccessGuard>
      <CockpitProvider>
        <CockpitShellLayout>{children}</CockpitShellLayout>
      </CockpitProvider>
    </CHAdminAccessGuard>
  );
}
