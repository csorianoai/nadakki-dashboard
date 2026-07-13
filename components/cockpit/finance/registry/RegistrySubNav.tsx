"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const TABS = [
  { id: "professions", label: "Profesiones", href: "?tab=professions" },
  { id: "entity-types", label: "Tipos de entidad", href: "?tab=entity-types" },
] as const;

export function RegistrySubNav() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useSearchParams();
  const tab = params.get("tab") || "professions";

  if (!pathname?.startsWith("/cockpit/finance/registry")) return null;

  return (
    <nav className="mb-4 flex gap-2 border-b border-cockpit-border pb-2">
      {TABS.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => router.push(`/cockpit/finance/registry?tab=${t.id}`)}
          className={`px-3 py-1.5 text-xs font-medium ${
            tab === t.id ? "border-b-2 border-cockpit-accent text-cockpit-text" : "text-cockpit-muted"
          }`}
        >
          {t.label}
        </button>
      ))}
    </nav>
  );
}

export const SNAKE_CASE = /^[a-z][a-z0-9_]*$/;
