"use client";

import { usePathname, useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { CHPortalAccessGuard } from "@/components/credit-hub/system/CHPortalAccessGuard";
import { ChAppShell } from "@/components/credit-hub/shell/ChAppShell";
import { ChTopbar } from "@/components/credit-hub/shell/ChTopbar";
import { useNotifications } from "@/lib/credit-hub/hooks/useNotifications";
import { ChSidebar } from "@/components/credit-hub/shell/ChSidebar";
import { useChromeIdentity } from "@/components/credit-hub/shell/useChromeIdentity";
import { BANK_NAV_ROUTES, bankTrailForPath, pathnameToBankNavId } from "@/lib/credit-hub/bank/bankFormat";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useAuth } from "@/hooks/useAuth";
import { IrAlPanelNuevo } from "@/components/credit-hub/bank/IrAlPanelNuevo";

export function BankChShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { tenantConfig } = useTenantConfig();
  const { logout } = useAuth();
  const identity = useChromeIdentity();
  const active = pathnameToBankNavId(pathname ?? "");
  const trail = bankTrailForPath(pathname ?? "");
  const notif = useNotifications();

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <CHTenantGuard>
      <CHPortalAccessGuard portal="bank">
        <ChAppShell
          persona="bank"
          tenantName={tenantConfig.institution_name}
          trail={trail}
          user={{ name: identity.name, initials: identity.initials }}
          userEmail={identity.email}
          topbar={
            <ChTopbar
              trail={trail}
              tenantName={tenantConfig.institution_name}
              user={{ name: identity.name, initials: identity.initials }}
              userEmail={identity.email}
              notifications={notif.items}
              notif={notif.unreadCount}
              showNotificationsBell={!notif.hidden}
            />
          }
          sidebar={
            <ChSidebar
              persona="bank"
              active={active}
              institutionName={tenantConfig.institution_name}
              user={{ name: identity.name, role: identity.role, initials: identity.initials }}
              onLogout={handleLogout}
              onNavigate={(id) => {
                const href = BANK_NAV_ROUTES[id];
                if (href) router.push(href);
              }}
            />
          }
        >
          <IrAlPanelNuevo />
          {children}
        </ChAppShell>
      </CHPortalAccessGuard>
    </CHTenantGuard>
  );
}
