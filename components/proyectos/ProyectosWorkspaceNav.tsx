"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const WORKSPACE_PAGES: { slug: string; label: string }[] = [
  { slug: "", label: "Detalle" },
  { slug: "analisis", label: "Análisis" },
  { slug: "master-plan", label: "Master plan" },
  { slug: "escenarios", label: "Escenarios" },
  { slug: "wbs", label: "WBS" },
  { slug: "riesgos", label: "Riesgos" },
  { slug: "documentos", label: "Documentos" },
  { slug: "audit", label: "Auditoría" },
];

/** Sub-nave del workspace dentro de `/proyectos/[id]` — estilo blueprint / ndk-page. */
export function ProyectosWorkspaceNav({ proyectoId }: { proyectoId: string }) {
  const pathname = usePathname();
  const safeId = encodeURIComponent(proyectoId);
  const base = `/proyectos/${safeId}`;

  return (
    <nav
      aria-label="Workspace proyecto"
      className="mb-8 flex flex-wrap gap-2 border-b border-white/10 pb-4"
    >
      {WORKSPACE_PAGES.map(({ slug, label }) => {
        const href = slug ? `${base}/${slug}` : base;
        const isRoot = slug === "";
        const active = isRoot
          ? pathname === href || pathname === `${href}/`
          : pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={slug || "_root"}
            href={href}
            className={cn(
              "inline-flex min-h-[40px] items-center rounded-xl px-3.5 py-2 text-sm font-semibold tracking-tight transition-all duration-200",
              active
                ? "bg-gradient-to-r from-amber-500/25 to-amber-600/15 text-amber-100 shadow-[0_0_24px_-4px_rgba(245,158,11,0.45)] ring-1 ring-amber-400/40"
                : "border border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/5 hover:text-zinc-100",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
