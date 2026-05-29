"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { listProyectos } from "@/lib/projects/projectsClient";
import { cn } from "@/lib/utils";
import { isHrefActive } from "./forge-global-sidebar-nav";

const FINANZAS_LINKS = [
  { slug: "", label: "Resumen" },
  { slug: "facturas", label: "Facturas" },
  { slug: "cotizaciones", label: "Cotizaciones" },
  { slug: "pagos", label: "Pagos" },
  { slug: "deals", label: "Deals" },
  { slug: "eventos", label: "Eventos" },
  { slug: "ordenes-compra", label: "Órdenes de compra" },
  { slug: "presupuesto", label: "Presupuesto" },
] as const;

function FinanzasGroupHeader() {
  return (
    <div className="px-6 pb-0.5 pt-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-zinc-500">Finanzas</p>
    </div>
  );
}

export function ProyectosFinanzasSidebarLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { tenant, isAuthenticated } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(null);

  useEffect(() => {
    if (!tenant?.id || !isAuthenticated) {
      setProjectId(null);
      return;
    }
    let cancelled = false;
    listProyectos({ tenantId: tenant.id, query: "?limit=1" })
      .then((items) => {
        if (!cancelled) setProjectId(items[0]?.id ?? null);
      })
      .catch(() => {
        if (!cancelled) setProjectId(null);
      });
    return () => {
      cancelled = true;
    };
  }, [tenant?.id, isAuthenticated]);

  if (!projectId) return null;

  const base = `/proyectos/${encodeURIComponent(projectId)}/finanzas`;

  return (
    <>
      <FinanzasGroupHeader />
      {FINANZAS_LINKS.map(({ slug, label }) => {
        const href = slug ? `${base}/${slug}` : base;
        const active = isHrefActive(href, pathname);
        return (
          <Link
            key={slug || "_resumen"}
            href={href}
            onClick={onNavigate}
            className={cn(
              "flex min-h-8 items-center gap-2 rounded-md py-1.5 pl-9 pr-3 text-xs transition-colors duration-150",
              "focus-visible:outline focus-visible:ring-2 focus-visible:ring-violet-500/40",
              active
                ? "border-l-2 border-violet-500 bg-violet-500/5 text-violet-300"
                : "border-l-2 border-transparent text-zinc-400 hover:bg-zinc-800/40 hover:text-zinc-200",
            )}
            aria-current={active ? "page" : undefined}
          >
            <span className="h-1 w-1 shrink-0 rounded-full bg-zinc-600" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{label}</span>
          </Link>
        );
      })}
    </>
  );
}
