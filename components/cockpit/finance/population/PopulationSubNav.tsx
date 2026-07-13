"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { id: "summary", label: "Resumen" },
  { id: "by-core", label: "Por core" },
  { id: "by-family", label: "Por familia", pending: "F4" },
  { id: "by-entity", label: "Por entidad", pending: "F4" },
  { id: "by-country", label: "Por país", pending: "F4" },
  { id: "digital-agents", label: "Agentes digitales", pending: "F4" },
  { id: "activity", label: "Actividad", pending: "F4" },
] as const;

export type PopulationTabId = (typeof TABS)[number]["id"];

export function PopulationSubNav({
  activeOnly,
}: {
  activeOnly?: PopulationTabId[];
}) {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const tab = (params.get("tab") as PopulationTabId) || "summary";

  if (!pathname?.startsWith("/cockpit/finance/population")) return null;

  return (
    <nav className="mb-4 flex flex-wrap gap-2 border-b border-cockpit-border pb-2" aria-label="Población">
      {TABS.map((t) => {
        const enabled = !activeOnly || activeOnly.includes(t.id);
        const active = tab === t.id;
        return (
          <button
            key={t.id}
            type="button"
            disabled={!enabled}
            onClick={() => enabled && router.push(`/cockpit/finance/population?tab=${t.id}`)}
            className={`rounded-t px-3 py-1.5 text-xs font-medium transition-colors ${
              active
                ? "border-b-2 border-cockpit-accent text-cockpit-text"
                : enabled
                  ? "text-cockpit-muted hover:text-cockpit-text"
                  : "cursor-not-allowed text-cockpit-muted/50"
            }`}
          >
            {t.label}
            {"pending" in t && t.pending && !enabled ? (
              <span className="ml-1 rounded bg-blue-500/20 px-1 text-[10px] text-blue-300">
                PENDIENTE {t.pending}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}

export function PopulationPendingPanel({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-cockpit-border bg-cockpit-surface p-8 text-center">
      <p className="text-lg font-medium">{label}</p>
      <p className="mt-2 text-cockpit-muted">Próximamente</p>
      <span className="mt-3 inline-block rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">PENDIENTE F4</span>
    </div>
  );
}

export function RegistryLinkHint() {
  return (
    <Link href="/cockpit/finance/registry" className="text-xs text-cockpit-accent hover:underline">
      Registrar profesiones →
    </Link>
  );
}
