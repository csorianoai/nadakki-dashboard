"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { LayoutGrid } from "lucide-react";
import NavigationBar from "@/components/ui/NavigationBar";
import { COCKPIT_CONSOLIDATION_FLAGS } from "@/lib/cockpit/finance-v3/flags";

export default function AdminTenantDetailPage() {
  const params = useParams();
  const id = typeof params?.id === "string" ? params.id : "";

  return (
    <div className="ndk-page ndk-fade-in">
      <NavigationBar backHref="/tenants" />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="m-0 text-2xl font-bold text-white">Tenant</h1>
          <p className="m-0 font-mono text-sm text-slate-400">{id || "—"}</p>
        </div>
        {COCKPIT_CONSOLIDATION_FLAGS.COCKPIT_CONSOLIDATION_ENABLED && id ? (
          <a
            href={`/cockpit/tenants/${encodeURIComponent(id)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-600 px-3 py-2 text-sm text-slate-300 transition-colors hover:border-indigo-400 hover:text-indigo-300"
            data-testid="admin-tenant-cockpit-link"
          >
            <LayoutGrid className="h-4 w-4" aria-hidden />
            Ver métricas y análisis en Cockpit →
          </a>
        ) : null}
      </div>
      <Link href="/tenants" className="text-sm text-indigo-400 hover:text-indigo-300">
        ← Volver a lista de tenants
      </Link>
    </div>
  );
}
