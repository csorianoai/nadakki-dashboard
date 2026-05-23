"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const WORKSPACE_PAGES: { slug: string; label: string }[] = [
  { slug: "", label: "Detalle" },
  { slug: "master-plan", label: "Master plan" },
  { slug: "escenarios", label: "Escenarios" },
  { slug: "wbs", label: "WBS" },
  { slug: "riesgos", label: "Riesgos" },
  { slug: "documentos", label: "Documentos" },
  { slug: "audit", label: "Auditoría" },
];

/** Sub-nave del workspace dentro de `/proyectos/[id]` (CAP-85..90). */
export function ProyectosWorkspaceNav({ proyectoId }: { proyectoId: string }) {
  const pathname = usePathname();
  const safeId = encodeURIComponent(proyectoId);
  const base = `/proyectos/${safeId}`;

  return (
    <nav
      aria-label="Workspace proyecto"
      className="mb-6 flex flex-wrap gap-2 border-b border-gray-200 pb-3 dark:border-gray-700"
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
              "inline-flex min-h-[40px] items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              active
                ? "bg-violet-100 text-violet-900 ring-2 ring-violet-300 dark:bg-violet-950/60 dark:text-violet-50 dark:ring-violet-600"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-100",
            )}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
