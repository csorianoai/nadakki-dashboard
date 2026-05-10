"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  Calculator,
  ClipboardList,
  Gauge,
  Home,
  Keyboard,
  LayoutList,
  LogOut,
  Plus,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { usePersona } from "@/components/credit-hub/system/PersonaProvider";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/forge/ui/Button";
import { CommandPalette, type CommandPaletteAction, type CommandPaletteGroup } from "@/components/forge/ui/CommandPalette";
import { Modal } from "@/components/forge/ui/Modal";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { forgePaletteCopy } from "@/utils/forge-palette-copy";

const APP_ID_LIKE = /^APP-[A-Z0-9._-]+$/i;

export function ForgeCreditHubCommandPalette({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const router = useRouter();
  const persona = usePersona();
  const { logout } = useAuth();
  const { tenantConfig } = useTenantConfig();
  const p = forgePaletteCopy(tenantConfig.locale);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const base = `/credit-hub/${persona}`;
  const appsList = `${base}/applications`;

  const go = useCallback(
    (href: string) => {
      router.push(href);
      onOpenChange(false);
    },
    [onOpenChange, router]
  );

  const groups = useMemo((): CommandPaletteGroup[] => {
    const trimmed = query.trim();
    const searchGroup: CommandPaletteAction[] = [];
    if (trimmed) {
      searchGroup.push({
        id: "search-applications",
        label: p.searchApplications(trimmed),
        keywords: [trimmed, "search", "buscar", "q"],
        icon: <Search className="h-4 w-4" aria-hidden />,
        onSelect: () => go(`${appsList}?q=${encodeURIComponent(trimmed)}`),
      });
      if (APP_ID_LIKE.test(trimmed)) {
        searchGroup.push({
          id: "goto-application",
          label: p.goApplicationId(trimmed),
          keywords: [trimmed, "goto", "open"],
          icon: <LayoutList className="h-4 w-4" aria-hidden />,
          onSelect: () => go(`${appsList}/${encodeURIComponent(trimmed)}`),
        });
      }
    }

    const global: CommandPaletteAction[] = [
      {
        id: "dashboard",
        label: p.goDashboard,
        keywords: ["home", "inicio"],
        icon: <Home className="h-4 w-4" aria-hidden />,
        onSelect: () => go(base),
      },
      {
        id: "density-comfortable",
        label: p.densityComfortable,
        keywords: ["density", "table", "densidad"],
        icon: <Gauge className="h-4 w-4" aria-hidden />,
        onSelect: () => go(`${appsList}?density=comfortable`),
      },
      {
        id: "density-compact",
        label: p.densityCompact,
        keywords: ["density", "compact"],
        icon: <Gauge className="h-4 w-4" aria-hidden />,
        onSelect: () => go(`${appsList}?density=compact`),
      },
      {
        id: "density-dense",
        label: p.densityDense,
        keywords: ["density", "dense"],
        icon: <Gauge className="h-4 w-4" aria-hidden />,
        onSelect: () => go(`${appsList}?density=dense`),
      },
      {
        id: "profile",
        label: p.profileSettings,
        keywords: ["account", "cuenta", "settings"],
        icon: <UserRound className="h-4 w-4" aria-hidden />,
        onSelect: () => go("/tenants"),
      },
      {
        id: "shortcuts",
        label: p.shortcuts,
        keywords: ["keyboard", "keys", "atajos"],
        icon: <Keyboard className="h-4 w-4" aria-hidden />,
        onSelect: () => {
          onOpenChange(false);
          setShortcutsOpen(true);
        },
      },
      {
        id: "signout",
        label: p.signOut,
        keywords: ["logout", "exit", "salir"],
        icon: <LogOut className="h-4 w-4" aria-hidden />,
        onSelect: () => {
          logout();
          onOpenChange(false);
        },
      },
    ];

    const bank: CommandPaletteAction[] =
      persona === "bank"
        ? [
            {
              id: "bank-apps",
              label: p.bankApplications,
              keywords: ["applications", "queue", "bandeja"],
              icon: <ClipboardList className="h-4 w-4" aria-hidden />,
              onSelect: () => go("/credit-hub/bank/applications"),
            },
            {
              id: "bank-queue",
              label: p.bankQueue,
              keywords: ["pending", "review", "queue", "applications", "bandeja"],
              icon: <Building2 className="h-4 w-4" aria-hidden />,
              onSelect: () => go("/credit-hub/bank/applications"),
            },
            {
              id: "bank-audit",
              label: p.bankAudit,
              icon: <ClipboardList className="h-4 w-4" aria-hidden />,
              onSelect: () => go("/credit-hub/bank/audit"),
            },
            {
              id: "bank-compliance",
              label: p.bankCompliance,
              icon: <ShieldCheck className="h-4 w-4" aria-hidden />,
              onSelect: () => go("/credit-hub/bank/compliance"),
            },
            {
              id: "bank-alerts",
              label: p.bankAlerts,
              icon: <ShieldAlert className="h-4 w-4" aria-hidden />,
              onSelect: () => go("/credit-hub/bank/compliance"),
            },
            {
              id: "switch-tenant",
              label: p.switchTenantSoon,
              keywords: ["tenant", "institution"],
              icon: <Building2 className="h-4 w-4" aria-hidden />,
              onSelect: () => undefined,
            },
          ]
        : [];

    const dealer: CommandPaletteAction[] =
      persona === "dealer"
        ? [
            {
              id: "dealer-new",
              label: p.dealerNew,
              keywords: ["create", "nueva"],
              icon: <Plus className="h-4 w-4" aria-hidden />,
              onSelect: () => go("/credit-hub/dealer/applications/new/applicant"),
            },
            {
              id: "dealer-drafts",
              label: p.dealerDrafts,
              keywords: ["draft", "borrador"],
              icon: <LayoutList className="h-4 w-4" aria-hidden />,
              onSelect: () => go(`${appsList}?status=draft`),
            },
            {
              id: "dealer-submitted",
              label: p.dealerSubmitted,
              icon: <LayoutList className="h-4 w-4" aria-hidden />,
              onSelect: () => go(`${appsList}?status=submitted`),
            },
            {
              id: "dealer-approved",
              label: p.dealerApproved,
              icon: <LayoutList className="h-4 w-4" aria-hidden />,
              onSelect: () => go(`${appsList}?status=approved`),
            },
            {
              id: "dealer-sim",
              label: p.dealerSimulator,
              icon: <Calculator className="h-4 w-4" aria-hidden />,
              onSelect: () => go("/credit-hub/dealer/preapproval"),
            },
          ]
        : [];

    const out: CommandPaletteGroup[] = [];
    if (searchGroup.length) out.push({ id: "search", heading: p.groupSearch, actions: searchGroup });
    out.push({ id: "global", heading: p.groupGlobal, actions: global });
    if (bank.length) out.push({ id: "bank", heading: p.groupBank, actions: bank });
    if (dealer.length) out.push({ id: "dealer", heading: p.groupDealer, actions: dealer });
    return out;
  }, [appsList, base, go, p, persona, query]);

  return (
    <>
      <CommandPalette
        open={open}
        onOpenChange={onOpenChange}
        groups={groups}
        search={query}
        onSearchChange={setQuery}
        placeholder={p.placeholder}
        emptyMessage={p.empty}
        keyboardShortcut={false}
      />
      <Modal
        open={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        title={p.shortcutsModalTitle}
        description={p.shortcutsModalIntro}
        footer={
          <div className="flex justify-end">
            <Button type="button" variant="secondary" onClick={() => setShortcutsOpen(false)}>
              {tenantConfig.locale?.toLowerCase().startsWith("en") ? "Close" : "Cerrar"}
            </Button>
          </div>
        }
      >
        <ul className="list-inside list-disc space-y-2 text-forge-sm text-forgeGray-700">
          <li>
            <kbd className="rounded-forge-sm border border-forgeGray-200 bg-forgeSurface-sunken px-1 font-forgeMono text-forge-xs">Ctrl+K</kbd> /{" "}
            <kbd className="rounded-forge-sm border border-forgeGray-200 bg-forgeSurface-sunken px-1 font-forgeMono text-forge-xs">⌘K</kbd> — {p.scPalette}
          </li>
          <li>
            <kbd className="rounded-forge-sm border border-forgeGray-200 bg-forgeSurface-sunken px-1 font-forgeMono text-forge-xs">Esc</kbd> — {p.scEsc}
          </li>
          <li>
            <kbd className="rounded-forge-sm border border-forgeGray-200 bg-forgeSurface-sunken px-1 font-forgeMono text-forge-xs">Tab</kbd> — {p.scTab}
          </li>
          <li>
            <kbd className="rounded-forge-sm border border-forgeGray-200 bg-forgeSurface-sunken px-1 font-forgeMono text-forge-xs">Shift+Tab</kbd> —{" "}
            {p.scShiftTab}
          </li>
          <li>
            <kbd className="rounded-forge-sm border border-forgeGray-200 bg-forgeSurface-sunken px-1 font-forgeMono text-forge-xs">Enter</kbd> — {p.scEnter}
          </li>
        </ul>
      </Modal>
    </>
  );
}
