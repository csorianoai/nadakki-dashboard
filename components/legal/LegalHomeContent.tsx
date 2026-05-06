"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useTenant } from "@/contexts/TenantContext";
import { LegalStatusStrip } from "@/components/legal/LegalStatusStrip";
import { RecentActivityList } from "@/components/legal/RecentActivityList";
import { TaskLauncher } from "@/components/legal/TaskLauncher";
import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";
import { useLegalTasks } from "@/hooks/useLegalTasks";
import { useLegalRecentActivity } from "@/hooks/useLegalRecentActivity";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";

export default function LegalHomeContent() {
  const m = useLegalHomeMessages();
  const { settings } = useTenant();
  const auth = useAuth();
  const { effectiveTenantId } = useLegalEffectiveTenantId();
  const { tasks, loading, error, refetch } = useLegalTasks("do");
  const recent = useLegalRecentActivity(effectiveTenantId, 5);

  const showAdmin = auth.role === "admin" || auth.role === "owner";

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col">
      <header className="border-b border-forgeInk-200 px-6 py-5 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-forge-text">{m.title}</h1>
            <p className="mt-1 text-forge-sm text-forge-text-muted">{m.subtitle}</p>
          </div>
          <div className="flex flex-col items-end gap-1 text-right">
            <p className="text-forge-sm text-forge-text-muted">
              <span className="font-medium text-forge-text">{m.tenant_label}:</span> {settings.name}
            </p>
            {showAdmin ? (
              <span className="rounded-forge-pill border border-forgeInk-200 bg-forgeSurface-sunken px-2 py-0.5 text-xs font-medium text-forge-text-muted">
                {m.admin_badge}
              </span>
            ) : null}
          </div>
        </div>
      </header>

      <LegalStatusStrip tenantId={effectiveTenantId} />

      <main className="flex-1 px-6 py-6 md:px-8">
        <h2 className="text-lg font-semibold text-forge-text">{m.task_launcher_heading}</h2>
        <p className="mt-1 text-forge-sm text-forge-text-muted">{m.task_launcher_subheading}</p>
        <div className="mt-6">
          <TaskLauncher tasks={tasks} loading={loading} error={error} onRetry={() => void refetch()} />
        </div>
      </main>

      <section className="border-t border-forgeInk-200 px-6 py-4 md:px-8">
        <h3 className="mb-3 text-forge-sm font-semibold text-forge-text">{m.recent_activity}</h3>
        <RecentActivityList entries={recent.entries} loading={recent.loading} />
      </section>
    </div>
  );
}
