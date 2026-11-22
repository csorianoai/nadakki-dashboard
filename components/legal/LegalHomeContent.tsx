"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { LegalStatusStrip } from "@/components/legal/LegalStatusStrip";
import { RecentActivityList } from "@/components/legal/RecentActivityList";
import { TaskLauncher } from "@/components/legal/TaskLauncher";
import { MyReviewsPanel } from "@/components/legal/home/MyReviewsPanel";
import { UpcomingHearingsPanel } from "@/components/legal/home/UpcomingHearingsPanel";
import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";
import { useLegalTasks } from "@/hooks/useLegalTasks";
import { useLegalRecentActivity } from "@/hooks/useLegalRecentActivity";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { useLegalCases } from "@/hooks/legal/useLegalCases";

/**
 * Inicio legal ("Mi despacho"). Orden: lo que vence → lo que espera revisión →
 * audiencias → tareas con IA → actividad. La navegación (expedientes, investigación,
 * auditoría, configuración) vive en la barra lateral; aquí no se repite.
 */
export default function LegalHomeContent() {
  const m = useLegalHomeMessages();
  const { settings } = useTenant();
  const auth = useAuth();
  const { effectiveTenantId } = useLegalEffectiveTenantId();
  const { tasks, loading, error, refetch } = useLegalTasks("do");
  const recent = useLegalRecentActivity(effectiveTenantId, 5);
  const casesQ = useLegalCases(effectiveTenantId);

  const showAdmin = auth.role === "admin" || auth.role === "owner";

  return (
    <div id="main-content" className="flex min-h-[calc(100vh-10rem)] flex-col space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">{m.hero_kicker}</p>
          <h1 className="text-2xl font-medium tracking-tight text-zinc-100 md:text-3xl">{m.title}</h1>
          <p className="text-sm text-zinc-400">{m.hero_description}</p>
          <p className="text-sm text-zinc-500">
            <span className="font-medium text-zinc-300">{m.tenant_label}:</span> {settings.name}
            {showAdmin ? (
              <span className="ml-2 inline-flex rounded-full border border-zinc-700 bg-zinc-900/80 px-2.5 py-0.5 text-xs font-medium text-zinc-400">
                {m.admin_badge}
              </span>
            ) : null}
          </p>
        </div>
        <Link
          href="/legal/cases/new"
          className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
        >
          <Plus className="h-4 w-4" aria-hidden />
          {m.new_case_cta}
        </Link>
      </header>

      <LegalStatusStrip tenantId={effectiveTenantId} />

      <div className="grid gap-6 lg:grid-cols-2">
        <MyReviewsPanel tenantId={effectiveTenantId} cases={casesQ.data?.cases ?? []} />
        <UpcomingHearingsPanel tenantId={effectiveTenantId} />
      </div>

      <section aria-labelledby="legal-tasks" className="space-y-4 rounded-2xl border border-zinc-800/50 bg-zinc-900/30 p-6">
        <h2 id="legal-tasks" className="text-base font-medium tracking-tight text-zinc-100">{m.main_heading}</h2>
        <p className="text-sm text-zinc-500">{m.main_subheading}</p>
        <TaskLauncher tasks={tasks} loading={loading} error={error} onRetry={() => void refetch()} />
      </section>

      <section aria-labelledby="legal-recent" className="rounded-2xl border border-zinc-800/50 bg-zinc-900/20 p-6">
        <h2 id="legal-recent" className="text-base font-medium tracking-tight text-zinc-100">{m.recent_activity}</h2>
        <div className="mt-4">
          <RecentActivityList entries={recent.entries} loading={recent.loading} />
        </div>
      </section>
    </div>
  );
}
