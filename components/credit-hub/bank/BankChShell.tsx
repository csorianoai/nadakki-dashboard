"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { CHPortalAccessGuard } from "@/components/credit-hub/system/CHPortalAccessGuard";
import { ChAppShell } from "@/components/credit-hub/shell/ChAppShell";
import { ChSidebar } from "@/components/credit-hub/shell/ChSidebar";
import { useChromeIdentity } from "@/components/credit-hub/shell/useChromeIdentity";
import { BANK_NAV_ROUTES, bankTrailForPath, pathnameToBankNavId } from "@/lib/credit-hub/bank/bankFormat";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";

export function BankChShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { tenantConfig } = useTenantConfig();
  const identity = useChromeIdentity();
  const active = pathnameToBankNavId(pathname ?? "");
  const trail = bankTrailForPath(pathname ?? "");

  return (
    <CHTenantGuard>
      <CHPortalAccessGuard portal="bank">
        <ChAppShell
      persona="bank"
      tenantName={tenantConfig.institution_name}
      trail={trail}
      user={{ name: identity.name, initials: identity.initials }}
      userEmail={identity.email}
      sidebar={
        <ChSidebar
          persona="bank"
          active={active}
          institutionName={tenantConfig.institution_name}
          user={{ name: identity.name, role: identity.role, initials: identity.initials }}
          onNavigate={(id) => {
            const href = BANK_NAV_ROUTES[id];
            if (href) router.push(href);
          }}
        />
      }
    >
      {children}
    </ChAppShell>
      </CHPortalAccessGuard>
    </CHTenantGuard>
  );
}
