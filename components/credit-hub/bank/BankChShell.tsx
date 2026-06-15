"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { ChAppShell } from "@/components/credit-hub/shell/ChAppShell";
import { ChSidebar } from "@/components/credit-hub/shell/ChSidebar";
import { BANK_NAV_ROUTES, bankTrailForPath, pathnameToBankNavId } from "@/lib/credit-hub/bank/bankFormat";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";

export function BankChShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { tenantConfig } = useTenantConfig();
  const active = pathnameToBankNavId(pathname ?? "");
  const trail = bankTrailForPath(pathname ?? "");

  return (
    <ChAppShell
      persona="bank"
      tenantName={tenantConfig.institution_name}
      trail={trail}
      sidebar={
        <ChSidebar
          persona="bank"
          active={active}
          institutionName={tenantConfig.institution_name}
          onNavigate={(id) => {
            const href = BANK_NAV_ROUTES[id];
            if (href) router.push(href);
          }}
        />
      }
    >
      {children}
    </ChAppShell>
  );
}
