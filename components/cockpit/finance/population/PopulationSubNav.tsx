"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { id: "summary", label: "Resumen" },
  { id: "by-core", label: "Por core" },
  { id: "by-family", label: "Por familia" },
  { id: "by-entity", label: "Por entidad" },
  { id: "by-country", label: "Por país" },
  { id: "digital-agents", label: "Agentes digitales" },
  { id: "activity", label: "Actividad" },
] as const;

export type PopulationTabId = (typeof TABS)[number]["id"];

export function PopulationSubNav() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const tab = (params.get("tab") as PopulationTabId) || "summary";

  if (!pathname?.startsWith("/cockpit/finance/population")) return null;

  return (
    <nav className="mb-4 flex flex-wrap gap-2 border-b border-cockpit-border pb-2" aria-label="Población">
      {TABS.map((t) => {
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            onClick={() => router.push(`/cockpit/finance/population?tab=${t.id}`)}
            className={`rounded-t px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "border-b-2 border-cockpit-accent text-cockpit-text"
                : "text-cockpit-muted hover:text-cockpit-text"
            }`}
          >
            {t.label}
          </button>
        );
      })}
    </nav>
  );
}

export function RegistryLinkHint() {
  return (
    <Link href="/cockpit/finance/registry" className="text-xs text-cockpit-accent hover:underline">
      Registrar profesiones →
    </Link>
  );
}
