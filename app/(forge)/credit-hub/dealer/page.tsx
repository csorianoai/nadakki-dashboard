"use client";

import Link from "next/link";
import { ArrowRight, Plus } from "lucide-react";
import { ApplicationCard } from "@/components/credit-hub/dealer/ApplicationCard";
import { DashboardHero } from "@/components/credit-hub/dealer/DashboardHero";
import { ForgeMetricCard } from "@/components/credit-hub/dealer/ForgeMetricCard";
import { ForgeButton } from "@/components/credit-hub/primitives/ForgeButton";
import { ForgeCard } from "@/components/credit-hub/primitives/ForgeCard";
import { useCreditApplications } from "@/lib/credit-hub/hooks/useCreditApplications";
import { useCreditStats } from "@/lib/credit-hub/hooks/useCreditStats";

export default function DealerDashboardPage() {
  const applicationsQuery = useCreditApplications();
  const statsQuery = useCreditStats();
  const applications = applicationsQuery.data ?? [];
  const total = statsQuery.data?.total_applications ?? applications.length;
  const drafts = statsQuery.data?.draft_applications ?? applications.filter((application) => application.status === "draft").length;
  const submitted =
    statsQuery.data?.submitted_applications ??
    applications.filter((application) => ["submitted", "processed", "processing"].includes(application.status)).length;
  const thisWeek =
    statsQuery.data?.applications_this_week ??
    applications.filter((application) => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return new Date(application.created_at) >= oneWeekAgo;
    }).length;
  const recent = [...applications]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);
  const isLoading = applicationsQuery.isLoading || statsQuery.isLoading;
  const error = applicationsQuery.error ?? statsQuery.error;
  const hasStats = !!statsQuery.data;
  const retry = () => {
    void applicationsQuery.refetch();
    void statsQuery.refetch();
  };

  return (
    <div className="space-y-8 p-4 md:p-8">
      <DashboardHero pendingCount={total === 0 ? null : submitted} loading={isLoading} />

      <section>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <ForgeMetricCard label="Total Solicitudes" value={hasStats ? total : total === 0 ? null : total} loading={isLoading} />
          <ForgeMetricCard label="En Borrador" value={hasStats ? drafts : total === 0 ? null : drafts} loading={isLoading} />
          <ForgeMetricCard
            label="Enviadas"
            value={hasStats ? submitted : total === 0 ? null : submitted}
            loading={isLoading}
            progress={submitted > 0 && total > 0 ? { value: (submitted / total) * 100, label: `${Math.round((submitted / total) * 100)}% del total` } : undefined}
          />
          <ForgeMetricCard
            label="Esta Semana"
            value={hasStats ? thisWeek : total === 0 ? null : thisWeek}
            loading={isLoading}
            trend={thisWeek > 0 ? { direction: "up", delta: thisWeek, label: "últimos 7 días" } : undefined}
          />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl font-bold text-forge-text">Solicitudes Recientes</h2>
          <Link href="/credit-hub/dealer/applications">
            <ForgeButton variant="ghost" size="sm" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Ver todas
            </ForgeButton>
          </Link>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-24 animate-pulse rounded-2xl bg-forge-surface" />
            ))}
          </div>
        ) : error ? (
          <ForgeCard className="py-12 text-center">
            <p className="mb-4 text-forge-danger">Error al cargar solicitudes reales</p>
            <ForgeButton variant="secondary" onClick={retry}>
              Reintentar
            </ForgeButton>
          </ForgeCard>
        ) : recent.length === 0 ? (
          <ForgeCard className="py-12 text-center">
            <p className="mb-4 text-forge-text-muted">No hay solicitudes aún</p>
            <Link href="/credit-hub/dealer/applications/new">
              <ForgeButton variant="primary" leftIcon={<Plus className="h-4 w-4" />}>
                Crear primera solicitud
              </ForgeButton>
            </Link>
          </ForgeCard>
        ) : (
          <div className="space-y-3">
            {recent.map((application) => (
              <ApplicationCard key={application.application_id} application={application} variant="card" className="md:hidden" />
            ))}
            {recent.map((application) => (
              <ApplicationCard key={`compact-${application.application_id}`} application={application} variant="compact" className="hidden md:flex" />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
