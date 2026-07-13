"use client";

import { useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { id: "professions", label: "Profesiones" },
  { id: "entity-types", label: "Tipos de entidad" },
] as const;

export type RegistryTabId = (typeof TABS)[number]["id"];

export const SNAKE_CASE = /^[a-z][a-z0-9_]*$/;

export function RegistrySubNav() {
  const router = useRouter();
  const params = useSearchParams();
  const tab = (params.get("tab") as RegistryTabId) || "professions";

  return (
    <nav className="mb-4 flex gap-2 border-b border-cockpit-border pb-2" data-testid="registry-tab-nav">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => router.replace(`/cockpit/finance/registry?tab=${t.id}`)}
          className={`rounded-lg px-3 py-1.5 text-xs transition-colors ${
            tab === t.id
              ? "bg-cockpit-accent/15 text-cockpit-text"
              : "text-cockpit-muted hover:bg-cockpit-border/40"
          }`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}
