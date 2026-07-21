"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { entitlementsAPI } from "@/lib/autos-portal/entitlements-api";
import type { DealerEntitlementContext, EntitlementDecision } from "@/types/entitlements";
import { REASON_CODE_INFO } from "@/types/entitlements";

const CORE_CAPABILITIES: Record<string, string> = {
  Inventory: "autos.inventory.view",
  Leads: "autos.leads.view",
  Financing: "autos.financing.view",
  Offers: "autos.offers.view",
  Commissions: "autos.commissions.view",
  Marketing: "marketing.campaigns.create",
  Legal: "legal.quick_check",
  Credit: "credit.applications.create",
  Accounting: "accounting.commissions.view",
};

const CORE_HREFS: Record<string, string> = {
  Inventory: "/autos/dealer/publicar-rapido",
  Leads: "/autos/dealer/leads",
  Financing: "/autos/vehiculos",
  Offers: "/autos/dashboard/mis-leads",
  Commissions: "/autos/dealer/insights",
  Marketing: "/marketing/campaigns",
  Legal: "/legal/contracts",
  Credit: "/credit-hub/dealer",
  Accounting: "/contable",
};

interface NavItem {
  label: string;
  href: string;
  capability_id: string;
  decision: EntitlementDecision;
}

export function CoreNavigation() {
  const [navItems, setNavItems] = useState<NavItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEntitlements() {
      const ctx: DealerEntitlementContext | null = await entitlementsAPI.getContext();
      const items: NavItem[] = [];

      for (const [label, capability_id] of Object.entries(CORE_CAPABILITIES)) {
        const decision =
          ctx?.capabilities[capability_id] ?? ({
            allowed: false,
            reason_code: "DEFAULT_DENY",
          } as EntitlementDecision);

        items.push({
          label,
          href: CORE_HREFS[label] ?? `/autos/dealer/${label.toLowerCase()}`,
          capability_id,
          decision,
        });
      }

      setNavItems(items);
      setLoading(false);
    }

    void loadEntitlements();
  }, []);

  if (loading) {
    return <p className="animate-pulse text-sm text-nk-fg-muted">Cargando capacidades…</p>;
  }

  return (
    <nav className="space-y-2" data-testid="core-navigation">
      {navItems.map((item) => (
        <NavItemRenderer key={item.capability_id} item={item} />
      ))}
    </nav>
  );
}

function NavItemRenderer({ item }: { item: NavItem }) {
  const { label, href, decision } = item;
  const info = REASON_CODE_INFO[decision.reason_code];

  if (decision.target_readiness === "BLOCKED") {
    return (
      <div
        className="flex cursor-not-allowed items-center justify-between rounded-r-sm border border-nk-border bg-nk-surface-2 p-3 text-nk-fg-muted"
        title={`${label} — ${info?.description ?? decision.reason_code}`}
      >
        <span>🔒 {label}</span>
        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-800">
          Coming Soon
        </span>
      </div>
    );
  }

  if (!decision.allowed) {
    const badge = decision.reason_code === "LIMIT_REACHED" ? "Limit Hit" : "Locked";

    return (
      <div
        className="flex cursor-not-allowed items-center justify-between rounded-r-sm border border-nk-border bg-nk-surface-2 p-3 text-nk-fg-muted"
        title={info?.description}
      >
        <span>
          🔒 {label}{" "}
          {decision.reason_code === "LIMIT_REACHED" &&
          decision.used != null &&
          decision.limit != null ? (
            <span className="ml-2 text-xs text-red-600">
              ({decision.used} / {decision.limit} used)
            </span>
          ) : null}
        </span>
        <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-bold text-yellow-800">
          {badge}
        </span>
      </div>
    );
  }

  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-r-sm border border-brand-2/30 bg-brand-2/5 p-3 text-nk-fg transition hover:bg-brand-2/10"
    >
      <span>
        ✅ {label}{" "}
        {decision.limit != null ? (
          <span className="ml-2 text-xs text-nk-fg-muted">
            ({decision.used ?? 0} / {decision.limit} used this month)
          </span>
        ) : null}
      </span>
      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-bold text-green-800">
        Available
      </span>
    </Link>
  );
}
