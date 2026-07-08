"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";
import { CHTenantGuard } from "@/components/credit-hub/system/CHTenantGuard";
import { CHPortalAccessGuard } from "@/components/credit-hub/system/CHPortalAccessGuard";
import { ChAppShell } from "@/components/credit-hub/shell/ChAppShell";
import { CH_NAV, ChSidebar } from "@/components/credit-hub/shell/ChSidebar";
import { useChromeIdentity } from "@/components/credit-hub/shell/useChromeIdentity";
import {
  DEALER_MOBILE_NAV_IDS,
  DEALER_NAV_ROUTES,
  dealerTrailForPath,
  pathnameToDealerNavId,
} from "@/lib/credit-hub/dealer/dealerFormat";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";

function useMobileShell(breakpoint = 640): boolean {
  const [mobile, setMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const update = () => setMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, [breakpoint]);
  return mobile;
}

function DealerMobileBottomNav({ active, onNavigate }: { active: string; onNavigate: (id: string) => void }) {
  const cfg = CH_NAV.dealer;
  const allItems = cfg.groups.flatMap((g) => g.items);
  const items = DEALER_MOBILE_NAV_IDS.map((id) => allItems.find((it) => it.id === id)).filter(Boolean) as typeof allItems;

  return (
    <nav aria-label="Mobile navigation" style={{ display: "flex", borderTop: "1px solid var(--ch-line)", background: "var(--ch-surface)", height: 60, flexShrink: 0 }}>
      {items.map((it) => {
        const on = active === it.id;
        const Icon = it.icon;
        return (
          <button
            key={it.id}
            type="button"
            onClick={() => onNavigate(it.id)}
            style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 3,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontFamily: "inherit",
              position: "relative",
              color: on ? "var(--ch-persona-text)" : "var(--ch-text-3)",
              minHeight: 44,
            }}
          >
            {on ? (
              <span style={{ position: "absolute", top: 0, left: "30%", right: "30%", height: 2.5, borderRadius: 3, background: "var(--ch-persona)" }} />
            ) : null}
            <Icon className="h-5 w-5" style={{ color: on ? "var(--ch-persona)" : "var(--ch-text-3)" }} strokeWidth={on ? 2 : 1.7} aria-hidden />
            <span style={{ fontSize: 10, fontWeight: on ? 600 : 500 }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

export function DealerChShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { tenantConfig } = useTenantConfig();
  const identity = useChromeIdentity();
  const isMobile = useMobileShell();
  const active = pathnameToDealerNavId(pathname ?? "");
  const trail = dealerTrailForPath(pathname ?? "");
  const inWizard = pathname?.includes("/applications/new") && !pathname?.includes("/complete");

  const navigate = (id: string) => {
    const href = DEALER_NAV_ROUTES[id];
    if (href) router.push(href);
  };

  if (inWizard) {
    return <div className="credit-hub-forge" data-persona="dealer">{children}</div>;
  }

  return (
    <CHTenantGuard>
      <CHPortalAccessGuard portal="dealer">
        <ChAppShell
      persona="dealer"
      mode={isMobile ? "mobile" : "desktop"}
      tenantName={tenantConfig.institution_name}
      trail={trail}
      user={{ name: identity.name, initials: identity.initials }}
      userEmail={identity.email}
      sidebar={
        <ChSidebar
          persona="dealer"
          active={active}
          institutionName={tenantConfig.institution_name}
          logoUrl={tenantConfig.branding.logo_url ?? undefined}
          user={{ name: identity.name, role: identity.role, initials: identity.initials }}
          onNavigate={navigate}
        />
      }
      bottomNav={<DealerMobileBottomNav active={active} onNavigate={navigate} />}
    >
      {children}
    </ChAppShell>
      </CHPortalAccessGuard>
    </CHTenantGuard>
  );
}
