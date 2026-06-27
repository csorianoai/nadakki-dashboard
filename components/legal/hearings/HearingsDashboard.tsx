"use client";

import { useMemo, useState } from "react";
import { CalendarDays, List, Plus } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import {
  useHearingConfig,
  useHearingKpis,
  useHearingsList,
} from "@/hooks/legal/useHearings";
import { canManageHearings } from "@/lib/legal/hearings/hearings-rbac";
import { HearingsApiError } from "@/lib/legal/hearings/hearings-api";
import type { HearingListFilters } from "@/lib/legal/hearings/hearings-types";
import { LegalLoadingSkeleton } from "@/components/legal/LegalLoadingSkeleton";
import { LegalEmptyState } from "@/components/legal/LegalEmptyState";
import { LegalErrorState } from "@/components/legal/LegalErrorState";
import { HearingsKpiCards } from "@/components/legal/hearings/HearingsKpiCards";
import { HearingFilters } from "@/components/legal/hearings/HearingFilters";
import { HearingsListView } from "@/components/legal/hearings/HearingsListView";
import { HearingsCalendarView } from "@/components/legal/hearings/HearingsCalendarView";
import { HearingCreateDialog } from "@/components/legal/hearings/HearingCreateDialog";

type ViewMode = "list" | "calendar";

function is403(err: unknown): boolean {
  return err instanceof HearingsApiError && err.status === 403;
}

function PermissionPanel() {
  return (
    <div
      className="rounded-xl border border-amber-500/40 bg-amber-500/10 p-6 text-amber-100"
      role="alert"
    >
      <p className="font-medium">Sin permiso</p>
      <p className="mt-1 text-sm">
        No tienes permiso para ver o gestionar audiencias. Si crees que es un error, contacta a un
        administrador del tenant.
      </p>
    </div>
  );
}

export function HearingsDashboard() {
  const { effectiveTenantId, tenantHydrated, tenantError } = useLegalEffectiveTenantId();
  const { allRoles } = useAuth();
  const canManage = canManageHearings(allRoles);

  const [filters, setFilters] = useState<HearingListFilters>({});
  const [view, setView] = useState<ViewMode>("list");
  const [createOpen, setCreateOpen] = useState(false);

  const tenantId = effectiveTenantId ?? "";
  const config = useHearingConfig(effectiveTenantId);
  const kpis = useHearingKpis(effectiveTenantId);
  const list = useHearingsList(effectiveTenantId, filters);

  const statuses = useMemo(() => config.data?.statuses ?? [], [config.data]);
  const hearingTypes = useMemo(() => config.data?.hearing_types ?? [], [config.data]);
  const defaultTimezone = config.data?.default_timezone ?? "America/Santo_Domingo";

  if (!tenantHydrated) {
    return <p className="text-sm text-zinc-500">Cargando tenant…</p>;
  }
  if (!effectiveTenantId || tenantError) {
    return (
      <p className="text-sm text-red-400" role="alert">
        {tenantError ?? "Tenant no disponible para audiencias"}
      </p>
    );
  }

  if (is403(list.error) || is403(config.error) || is403(kpis.error)) {
    return (
      <main id="main-content" className="space-y-6">
        <Header canManage={false} onCreate={() => undefined} />
        <PermissionPanel />
      </main>
    );
  }

  const hearings = list.data?.hearings ?? [];

  return (
    <main id="main-content" className="space-y-6">
      <Header canManage={canManage} onCreate={() => setCreateOpen(true)} />

      {kpis.isLoading ? (
        <LegalLoadingSkeleton variant="card" />
      ) : kpis.isError ? (
        <LegalErrorState
          message={kpis.error instanceof Error ? kpis.error.message : "Error al cargar indicadores"}
          onRetry={() => void kpis.refetch()}
        />
      ) : kpis.data ? (
        <HearingsKpiCards kpis={kpis.data} />
      ) : null}

      <HearingFilters
        filters={filters}
        statuses={statuses}
        hearingTypes={hearingTypes}
        onChange={setFilters}
        disabled={config.isLoading}
      />

      <div className="flex items-center justify-end gap-1 rounded-lg border border-zinc-800/70 bg-zinc-900/30 p-1 sm:w-fit">
        <ViewToggleButton active={view === "list"} onClick={() => setView("list")} icon={List}>
          Lista
        </ViewToggleButton>
        <ViewToggleButton
          active={view === "calendar"}
          onClick={() => setView("calendar")}
          icon={CalendarDays}
        >
          Calendario
        </ViewToggleButton>
      </div>

      {list.isLoading ? (
        <LegalLoadingSkeleton variant="row" rows={6} />
      ) : list.isError ? (
        <LegalErrorState
          message={list.error instanceof Error ? list.error.message : "Error al cargar audiencias"}
          onRetry={() => void list.refetch()}
        />
      ) : hearings.length === 0 ? (
        <LegalEmptyState
          title="No hay audiencias para este rango"
          description="Ajusta los filtros o crea una nueva audiencia para comenzar."
          action={
            canManage ? (
              <button
                type="button"
                onClick={() => setCreateOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:brightness-110"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Nueva audiencia
              </button>
            ) : undefined
          }
        />
      ) : view === "list" ? (
        <HearingsListView
          tenantId={tenantId}
          hearings={hearings}
          statuses={statuses}
          canManage={canManage}
        />
      ) : (
        <HearingsCalendarView
          tenantId={tenantId}
          hearings={hearings}
          statuses={statuses}
          canManage={canManage}
        />
      )}

      {canManage ? (
        <HearingCreateDialog
          tenantId={tenantId}
          open={createOpen}
          onClose={() => setCreateOpen(false)}
          hearingTypes={hearingTypes}
          defaultTimezone={defaultTimezone}
        />
      ) : null}
    </main>
  );
}

function Header({ canManage, onCreate }: { canManage: boolean; onCreate: () => void }) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-zinc-800/50 pb-6">
      <div>
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Legal</p>
        <h1 className="mt-1 text-2xl font-medium tracking-tight text-zinc-100 md:text-3xl">
          Calendario de audiencias
        </h1>
      </div>
      {canManage ? (
        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Nueva audiencia
        </button>
      ) : null}
    </header>
  );
}

function ViewToggleButton({
  active,
  onClick,
  icon: Icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof List;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
        active ? "bg-zinc-800 text-zinc-100" : "text-zinc-400 hover:text-zinc-200"
      }`}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {children}
    </button>
  );
}
