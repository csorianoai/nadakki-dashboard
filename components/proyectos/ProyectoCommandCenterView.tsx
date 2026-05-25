"use client";

import Link from "next/link";
import { useMemo, useState, type ReactNode } from "react";
import { AlertTriangle, FileText, Gauge, Goal, PencilRuler, ScrollText } from "lucide-react";
import {
  AuditTimeline,
  type AuditTimelineEntry,
  Button,
  Card,
  Drawer,
  EmptyState,
  KpiCard,
  Skeleton,
  Tabs,
} from "@/components/forge";
import GlassCard from "@/components/ui/GlassCard";
import StatusBadge from "@/components/ui/StatusBadge";
import { motion } from "@/lib/motion-stub";
import {
  BP_ACCENTS,
  formatBudgetMillionsUsd,
  proyectoStateBadgeStatus,
  displayProjectName,
} from "@/components/proyectos/blueprint-projects-helpers";
import { useAnimatedCount } from "@/components/proyectos/useAnimatedMetric";
import { useProyectoAuditTrail } from "@/hooks/projects/useProyectos";
import type { AuditTrailEntry, Proyecto, ProyectoDocumentStub } from "@/lib/projects/types";
import {
  PROYECTO_STATE_LABELS_ES,
  PROYECTO_STATES,
  type ProyectoState,
  isProyectoState,
} from "@/lib/projects/types";
import { cn } from "@/lib/utils";

function fmtScore(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "—";
  return Number(value).toFixed(1);
}

function stateBadgeLabel(state: string | null | undefined): string {
  if (!state) return "Sin estado";
  const u = state.toUpperCase();
  return isProyectoState(u) ? PROYECTO_STATE_LABELS_ES[u] : state;
}

function normalizedState(state: string | null | undefined): string {
  return (state ?? "").toUpperCase();
}

function stateIndex(current: string | null | undefined): number {
  const u = normalizedState(current);
  return (PROYECTO_STATES as readonly string[]).indexOf(u);
}

function timelineDotClass(done: boolean, active: boolean, pending: boolean): string {
  if (pending) return "border-forgeGray-200 bg-forgeGray-50 text-forgeGray-400";
  if (active)
    return "border-forgeBrand-500 bg-forgeBrand-500/15 font-semibold text-forgeBrand-800 ring-2 ring-forgeBrand-400";
  if (done) return "border-forgeSuccess-600 bg-forgeSuccess-600 text-white";
  return "border-forgeGray-200 bg-white text-forgeGray-500";
}

function auditEntriesFromApi(entries: AuditTrailEntry[], proyectoId: string): AuditTimelineEntry[] {
  return entries.map((e, i) => ({
    id: String(e.id ?? `${proyectoId}-audit-${i}`),
    timestampLabel:
      e.created_at && !Number.isNaN(Date.parse(e.created_at))
        ? new Date(e.created_at).toLocaleString("es-DO")
        : "Sin marca de tiempo",
    actorLabel: e.actor_id ?? "Sistema",
    actionLabel: e.action ?? "Evento registrado",
    detail: e.detail ? JSON.stringify(e.detail) : undefined,
  }));
}

export interface ProyectoCommandCenterViewProps {
  proyecto: Proyecto;
}

export function ProyectoCommandCenterView({ proyecto }: ProyectoCommandCenterViewProps) {
  const proyectoId = proyecto.id;
  const auditQuery = useProyectoAuditTrail(proyectoId);
  const [tab, setTab] = useState("resumen");
  const [drawer, setDrawer] = useState<null | ProyectoDocumentStub>(null);

  const curIdx = stateIndex(proyecto.state ?? undefined);
  const phaseProgressPct =
    curIdx >= 0 ? Math.round((curIdx / Math.max(PROYECTO_STATES.length - 1, 1)) * 100) : 0;
  const animatedPhasePct = useAnimatedCount(phaseProgressPct, 960);

  const documentsPanel = useMemo(() => {
    const docs = proyecto.documents ?? [];
    if (!docs.length) {
      return (
        <EmptyState
          titleLevel={2}
          icon={<FileText />}
          title="Sin documentos indexados"
          description="Los adjuntos aparecerán aquí cuando el document store del core esté conectado para este proyecto."
        />
      );
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {docs.map((doc, idx) => {
          const label = String(doc.label ?? doc.name ?? `Documento ${idx + 1}`);
          const key = String(doc.id ?? doc.name ?? idx);
          return (
            <button
              key={key}
              type="button"
              className="flex min-h-12 flex-col items-center justify-center gap-2 rounded-forge-md border border-forgeGray-200 bg-forgeSurface-sunken p-4 text-center transition-colors hover:border-forgeBrand-400 hover:bg-forgeSurface-card focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
              onClick={() => setDrawer(doc)}
            >
              <FileText className="h-8 w-8 text-forgeGray-400" aria-hidden />
              <span className="text-forge-xs font-medium text-forgeGray-700">{label}</span>
            </button>
          );
        })}
      </div>
    );
  }, [proyecto.documents]);

  const timelinePanel = useMemo(() => {
    return (
      <div className="space-y-4">
        <p className="text-forge-sm text-forgeGray-600">
          Progresión de la máquina de estados (9 fases conocidas del core). Si el backend devuelve un estado no
          listado, los pasos quedan en tono pendiente.
        </p>
        <div className="overflow-x-auto pb-2">
          <ol className="flex min-w-[640px] items-stretch gap-0">
            {PROYECTO_STATES.map((stateKey, idx) => {
              const label = PROYECTO_STATE_LABELS_ES[stateKey as ProyectoState];
              const done = curIdx >= 0 && idx < curIdx;
              const active = curIdx >= 0 && idx === curIdx;
              const pending = curIdx < 0 || idx > curIdx;
              const isLast = idx === PROYECTO_STATES.length - 1;
              const seg: ReactNode = (
                <li key={stateKey} className="flex flex-1 items-center">
                  <div className="flex w-full flex-col items-center px-1 text-center">
                    <span
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-forge-md border text-forge-xs",
                        timelineDotClass(done, active, pending),
                      )}
                      aria-current={active ? "step" : undefined}
                    >
                      {idx + 1}
                    </span>
                    <span className="mt-2 max-w-[5.5rem] text-[10px] font-medium leading-tight text-forgeGray-600">
                      {label}
                    </span>
                  </div>
                  {!isLast ? (
                    <div
                      className={cn(
                        "mx-0.5 h-px flex-1 min-w-[16px]",
                        idx < curIdx ? "bg-forgeSuccess-500" : "bg-forgeGray-200",
                      )}
                      aria-hidden
                    />
                  ) : null}
                </li>
              );
              return seg;
            })}
          </ol>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-forge-xs text-forgeGray-500">Estado actual:</span>
          <StatusBadge
            status={proyectoStateBadgeStatus(proyecto.state)}
            label={stateBadgeLabel(proyecto.state)}
            size="sm"
            pulse={false}
          />
        </div>
      </div>
    );
  }, [curIdx, proyecto.state]);

  const auditEntries = auditEntriesFromApi(auditQuery.data ?? [], proyectoId);

  const auditPanel =
    auditEntries.length === 0 ? (
      auditQuery.isPending ? (
        <Skeleton className="h-48 w-full rounded-forge-md" />
      ) : auditQuery.isError ? (
        <EmptyState
          titleLevel={2}
          icon={<ScrollText />}
          title="Auditoría no disponible"
          description="Cuando `/audit-trail` responda, verás línea temporal de eventos. Puedes reintentar cuando el backend esté arriba."
          action={
            <Button type="button" variant="secondary" className="min-h-11" onClick={() => void auditQuery.refetch()}>
              Reintentar
            </Button>
          }
        />
      ) : (
        <EmptyState
          titleLevel={2}
          icon={<ScrollText />}
          title="Sin eventos auditados"
          description="Este proyecto no tiene registros enviados aún desde el servidor."
        />
      )
    ) : (
      <AuditTimeline entries={auditEntries} />
    );

  const overviewPanel = (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard
          label="Viabilidad (score)"
          value={fmtScore(proyecto.viability_score)}
          icon={Goal}
          hint="Campo provisional hasta estabilizar motor de scoring"
        />
        <KpiCard
          label="Riesgo (score)"
          value={fmtScore(proyecto.risk_score)}
          icon={AlertTriangle}
          hint="Menor suele indicar menor riesgo agregado (detalle en motor)"
        />
        <KpiCard
          label="Estado operativo"
          value={proyecto.state ?? "—"}
          icon={Gauge}
          hint="Sincronizado con máquina de estados"
        />
      </div>
      <Card className="p-4">
        <h2 className="font-display text-forge-sm font-semibold text-forgeGray-800">Contexto</h2>
        <dl className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-forge-xs text-forgeGray-500">Identificador</dt>
            <dd className="font-forgeMono text-forge-xs text-forgeGray-800">{proyecto.id}</dd>
          </div>
          <div>
            <dt className="text-forge-xs text-forgeGray-500">Tipo / metodología</dt>
            <dd className="text-forge-sm text-forgeGray-800">
              {proyecto.project_type ?? "—"} · {proyecto.methodology_pack ?? "—"}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-forge-xs text-forgeGray-500">Descripción</dt>
            <dd className="text-forge-sm text-forgeGray-800">{proyecto.description?.trim() || "Sin descripción capturada."}</dd>
          </div>
        </dl>
      </Card>
    </div>
  );

  const tabDefs = [
    { id: "resumen", label: "Resumen", panel: overviewPanel },
    { id: "timeline", label: "Timeline", panel: timelinePanel },
    { id: "documentos", label: "Documentos", panel: documentsPanel },
    { id: "audit", label: "Audit trail", panel: auditPanel },
  ];

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      >
        <GlassCard
          hover={false}
          className={cn(
            "relative overflow-hidden border border-amber-400/25 bg-gradient-to-br from-white/[0.08] via-white/[0.03] to-transparent p-6",
            "shadow-[0_0_60px_-12px_rgba(245,158,11,0.35)]",
          )}
        >
          <div
            className="pointer-events-none absolute -right-20 -top-24 h-56 w-56 rounded-full opacity-50 blur-[80px]"
            style={{ background: `radial-gradient(circle at 30% 30%, ${BP_ACCENTS.primary}, transparent 65%)` }}
            aria-hidden
          />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-amber-400/35 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-200">
                  <PencilRuler className="h-3.5 w-3.5 text-amber-300" aria-hidden />
                  Blueprint obra
                </span>
                <StatusBadge
                  status={proyectoStateBadgeStatus(proyecto.state)}
                  label={stateBadgeLabel(proyecto.state)}
                  size="sm"
                />
                {proyecto.project_type ? (
                  <span className="rounded-full border border-white/15 bg-white/5 px-2.5 py-0.5 text-forge-xs font-medium text-zinc-200">
                    {proyecto.project_type}
                  </span>
                ) : null}
              </div>
              <motion.h1
                className="mt-4 font-display text-2xl font-bold tracking-tight text-white drop-shadow-sm sm:text-3xl md:text-[2rem]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.08, duration: 0.35 }}
              >
                {displayProjectName(proyecto)}
              </motion.h1>
              <p className="mt-2 font-forgeMono text-xs text-zinc-400">{proyectoId}</p>
              <div className="mt-5 flex flex-wrap items-baseline gap-4 text-sm text-zinc-300">
                <span>
                  Presupuesto prelim.:{" "}
                  <strong className="font-mono text-amber-200">{formatBudgetMillionsUsd(proyecto)}</strong>
                </span>
              </div>
              <Link
                href="/proyectos"
                className="mt-3 inline-flex min-h-10 items-center text-sm font-medium text-amber-300/95 transition-colors hover:text-amber-200"
              >
                ← Panel de proyectos
              </Link>
            </div>
            <div className="min-w-[min(100%,260px)] flex-1 space-y-2 lg:max-w-sm lg:self-center">
              <div className="flex items-center justify-between text-[11px] font-medium uppercase tracking-wider text-zinc-400">
                <span>Avance máquina de estados</span>
                <span className="font-mono tabular-nums text-amber-200">{animatedPhasePct}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/[0.08] ring-1 ring-inset ring-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-amber-700 via-amber-400 to-amber-200 shadow-[0_0_22px_rgba(251,191,36,0.55)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${animatedPhasePct}%` }}
                  transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.06 }}
                  role="progressbar"
                  aria-valuenow={animatedPhasePct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <p className="text-[11px] leading-relaxed text-zinc-500">
                Fases del core proyectadas sobre el ciclo vivo de la obra — actualizado con el último estado
                registrado en tenant.
              </p>
            </div>
          </div>
        </GlassCard>
      </motion.div>

      <Tabs tabs={tabDefs} value={tab} onValueChange={setTab} />

      <Drawer
        open={!!drawer}
        onClose={() => setDrawer(null)}
        title={String(drawer?.label ?? drawer?.name ?? "Documento")}
        description={drawer?.id ? `Identificador: ${drawer.id}` : undefined}
        footer={
          <Button type="button" variant="secondary" className="min-h-11" onClick={() => setDrawer(null)}>
            Cerrar
          </Button>
        }
      >
        <p className="text-forge-sm text-forgeGray-700">
          Vista previa local (binario/API documental pendiente). Usa tu repositorio documental oficial para versiones firmadas.
        </p>
      </Drawer>
    </div>
  );
}
