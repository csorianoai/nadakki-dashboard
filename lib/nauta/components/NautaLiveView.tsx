"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";
import { resolveVisiblePlatformTitle } from "@/lib/white-label/brand-display";
import { NAUTA_LIVE_MAX_POLL_ATTEMPTS, NAUTA_LIVE_POLL_INTERVAL_MS } from "@/lib/nauta/liveConfig";
import { resolveFreeformRunError } from "@/lib/nauta/freeformErrors";
import { resolveLiveRun403Banner } from "@/lib/nauta/liveErrors";
import { normalizeRunArtifacts } from "@/lib/nauta/normalizers";
import {
  createLiveRun,
  pollLiveRun,
  type NautaLiveEngineRequested,
  NautaLiveRunError,
} from "@/lib/nauta/liveRunClient";
import type { NautaLiveViewStatus, NautaRunArtifacts } from "@/lib/nauta/types";
import { NautaLiveIframeBoundary } from "@/lib/nauta/components/NautaLiveIframeBoundary";
import { NautaRunReportPanel } from "@/lib/nauta/components/NautaRunReportPanel";
import { NautaTaskComposer } from "@/lib/nauta/components/NautaTaskComposer";
import { S } from "@/lib/nauta/strings";

export type { NautaLiveViewStatus };

export interface NautaLiveViewProps {
  taskName: string;
  engineRequested?: NautaLiveEngineRequested;
  targetUrl?: string;
  allowsFreeform?: boolean;
  initialRunId?: string;
  variant?: "panel" | "slot";
  idleHeading?: string;
  idleBody?: string;
  onOpenSupervision?: () => void;
}

interface RunSnapshot {
  runId: string | null;
  status: NautaLiveViewStatus;
  liveViewUrl: string | null;
  durationSeconds: number;
  estimatedCostUsd: number;
  estimatedTokens: number;
  findingsCount: number;
  failureCause: string | null;
  engineUsed: string | null;
  pollAttempts: number;
  artifacts: NautaRunArtifacts | null;
  stepCount: number | null;
  completedAtIso: string | null;
  apiCompletedAt: string | null;
}

const IDLE: RunSnapshot = {
  runId: null,
  status: "idle",
  liveViewUrl: null,
  durationSeconds: 0,
  estimatedCostUsd: 0,
  estimatedTokens: 0,
  findingsCount: 0,
  failureCause: null,
  engineUsed: null,
  pollAttempts: 0,
  artifacts: null,
  stepCount: null,
  completedAtIso: null,
  apiCompletedAt: null,
};

function mapPollStatus(status: string): NautaLiveViewStatus {
  if (status === "running") return "running";
  if (status === "completed") return "completed";
  if (status === "failed") return "failed";
  if (status === "blocked") return "blocked";
  if (status === "pending_approval") return "pending_approval";
  return "failed";
}

function isTerminalStatus(status: NautaLiveViewStatus): boolean {
  return status !== "running" && status !== "idle";
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function NautaLiveView({
  taskName,
  engineRequested = "auto",
  targetUrl,
  allowsFreeform = false,
  initialRunId,
  variant = "panel",
  idleHeading = "Transmisión disponible próximamente",
  idleBody = "Observe al empleado ejecutar cada paso en tiempo real, con la evidencia generándose sello a sello.",
  onOpenSupervision,
}: NautaLiveViewProps) {
  const { tenant } = useAuth();
  const { data: branding } = useTenantBranding();
  const institutionLabel = resolveVisiblePlatformTitle(branding, tenant);

  const [taskInstruction, setTaskInstruction] = useState("");
  const [run, setRun] = useState<RunSnapshot>(() =>
    initialRunId ? { ...IDLE, runId: initialRunId, status: "running" } : IDLE,
  );
  const [banner, setBanner] = useState<{ kind: string; message: string } | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const elapsedTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttemptsRef = useRef(0);

  const stopTimers = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
    if (elapsedTimerRef.current) {
      clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  }, []);

  const clearLiveIframe = useCallback(() => {
    setRun((prev) => (prev.liveViewUrl ? { ...prev, liveViewUrl: null } : prev));
  }, []);

  const applyPollData = useCallback(
    (data: Awaited<ReturnType<typeof pollLiveRun>>) => {
      const nextStatus = mapPollStatus(data.status);
      const terminal = isTerminalStatus(nextStatus);
      const artifacts = normalizeRunArtifacts(data.artifacts) ?? null;
      const stepCount =
        typeof data.step_count === "number" && Number.isFinite(data.step_count)
          ? data.step_count
          : null;

      setRun((prev) => ({
        ...prev,
        runId: data.id ?? prev.runId,
        status: nextStatus,
        liveViewUrl: terminal ? null : (data.live_view_url ?? prev.liveViewUrl),
        durationSeconds: data.duration_seconds ?? prev.durationSeconds,
        estimatedCostUsd: data.estimated_cost_usd ?? prev.estimatedCostUsd,
        estimatedTokens: data.estimated_tokens ?? prev.estimatedTokens,
        findingsCount: data.findings_count ?? prev.findingsCount,
        failureCause: data.failure_cause ?? prev.failureCause,
        engineUsed: data.engine_used ?? prev.engineUsed,
        artifacts: artifacts ?? prev.artifacts,
        stepCount: stepCount ?? prev.stepCount,
        apiCompletedAt:
          typeof data.completed_at === "string" && data.completed_at.trim()
            ? data.completed_at
            : prev.apiCompletedAt,
        completedAtIso: terminal && !prev.completedAtIso ? new Date().toISOString() : prev.completedAtIso,
      }));

      if (terminal) {
        stopTimers();
      }
    },
    [stopTimers],
  );

  const failRun = useCallback(
    (message: string) => {
      setRun((prev) => ({
        ...prev,
        status: "failed",
        failureCause: message,
        liveViewUrl: null,
        completedAtIso: prev.completedAtIso ?? new Date().toISOString(),
      }));
      stopTimers();
    },
    [stopTimers],
  );

  const pollOnce = useCallback(
    async (runId: string) => {
      try {
        const data = await pollLiveRun(runId);
        applyPollData(data);
        setPollError(null);
        return mapPollStatus(data.status);
      } catch (err) {
        const message =
          err instanceof NautaLiveRunError
            ? err.detail || err.message
            : err instanceof Error
              ? err.message
              : "Error de polling";
        if (err instanceof NautaLiveRunError && err.status === 403) {
          if (err.detail.toLowerCase().includes("freeform_not_allowed")) {
            const mapped = resolveFreeformRunError(403, err.detail);
            setPollError(mapped.message);
            failRun(mapped.message);
          } else {
            setBanner(resolveLiveRun403Banner(err.detail));
            setRun((prev) => ({
              ...prev,
              status: "blocked",
              failureCause: message,
              liveViewUrl: null,
              completedAtIso: prev.completedAtIso ?? new Date().toISOString(),
            }));
            stopTimers();
          }
        } else {
          failRun(message);
        }
        return "failed" as const;
      }
    },
    [applyPollData, failRun, stopTimers],
  );

  const startPolling = useCallback(
    (runId: string) => {
      stopTimers();
      pollAttemptsRef.current = 0;
      startedAtRef.current = Date.now();
      setElapsed(0);
      elapsedTimerRef.current = setInterval(() => {
        if (startedAtRef.current) {
          setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
        }
      }, 1000);

      const tick = async () => {
        pollAttemptsRef.current += 1;
        if (pollAttemptsRef.current > NAUTA_LIVE_MAX_POLL_ATTEMPTS) {
          failRun("Tiempo máximo de espera alcanzado (10 minutos)");
          return;
        }
        const status = await pollOnce(runId);
        if (status !== "running") {
          stopTimers();
        }
      };

      void tick();
      pollTimerRef.current = setInterval(() => {
        void tick();
      }, NAUTA_LIVE_POLL_INTERVAL_MS);
    },
    [failRun, pollOnce, stopTimers],
  );

  useEffect(() => {
    if (initialRunId) {
      startPolling(initialRunId);
    }
    return () => stopTimers();
  }, [initialRunId, startPolling, stopTimers]);

  const startLive = async () => {
    setBanner(null);
    setPollError(null);
    setRun({ ...IDLE, status: "running" });

    try {
      const trimmedTarget = targetUrl?.trim();
      const trimmedInstruction = allowsFreeform ? taskInstruction.trim() : "";
      const data = await createLiveRun({
        task_name: taskName,
        mode: "live",
        engine_requested: engineRequested,
        ...(trimmedTarget ? { target_url: trimmedTarget } : {}),
        ...(trimmedInstruction ? { task_instruction: trimmedInstruction } : {}),
        dry_run: false,
      });

      setRun({
        ...IDLE,
        runId: data.id,
        status: "running",
        liveViewUrl: data.live_view_url ?? null,
        engineUsed: data.engine_used ?? null,
      });
      startPolling(data.id);
    } catch (err) {
      setRun(IDLE);
      if (err instanceof NautaLiveRunError) {
        if (err.status === 403 && err.detail.toLowerCase().includes("freeform_not_allowed")) {
          const mapped = resolveFreeformRunError(403, err.detail);
          setPollError(mapped.message);
          return;
        }
        if (err.status === 403) {
          setBanner(resolveLiveRun403Banner(err.detail));
          return;
        }
        if (err.status === 422) {
          const mapped = resolveFreeformRunError(422, err.detail);
          setPollError(mapped.message);
          return;
        }
      }
      setPollError(err instanceof Error ? err.message : "No se pudo iniciar la ejecución live");
    }
  };

  const isRunning = run.status === "running";
  const showLiveIframe = isRunning && Boolean(run.liveViewUrl);
  const showReportPanel =
    (run.status === "completed" || run.status === "failed") && Boolean(run.runId) && Boolean(run.completedAtIso);
  const rootClass = variant === "slot" ? "live-view live-view--slot" : "live-view live-view--panel";

  return (
    <section className={rootClass} data-testid="nauta-live-view">
      {banner ? (
        <div
          className={`live-banner live-banner--${banner.kind}`}
          role="status"
          data-testid="nauta-live-banner"
        >
          {banner.message}
        </div>
      ) : null}

      {run.status === "pending_approval" ? (
        <div className="live-banner live-banner--pending" role="status" data-testid="nauta-live-pending">
          <span>{S.live.pendingApproval}</span>
          {onOpenSupervision ? (
            <button type="button" className="live-banner-link" onClick={onOpenSupervision}>
              {S.live.pendingApprovalLink}
            </button>
          ) : null}
        </div>
      ) : null}

      {allowsFreeform ? (
        <NautaTaskComposer value={taskInstruction} onChange={setTaskInstruction} disabled={isRunning} />
      ) : null}

      <div className="live-view-toolbar">
        <div className="live-view-meta">
          <span className="live-view-label">Ejecución live</span>
          <span className="live-view-tenant">{institutionLabel}</span>
          <span className="live-view-task mono">{taskName}</span>
          {run.runId ? (
            <span className="live-view-run-id mono" data-testid="nauta-live-run-id">
              {run.runId}
            </span>
          ) : null}
        </div>
        <button
          type="button"
          className="btn primary"
          disabled={isRunning || !taskName}
          onClick={() => void startLive()}
          data-testid="nauta-live-run-button"
        >
          {isRunning ? "Ejecutando…" : "Ejecutar Live"}
        </button>
      </div>

      {isRunning ? (
        <div className="live-view-running" aria-live="polite">
          <span className="pulse" aria-hidden />
          <span className="live-view-running-text">
            Ejecutando… <span className="mono num">{formatElapsed(elapsed)}</span>
          </span>
          {run.engineUsed ? (
            <span className="live-view-engine mono">{run.engineUsed}</span>
          ) : null}
        </div>
      ) : null}

      {pollError && run.status === "idle" ? (
        <p className="live-view-error" role="alert">
          {pollError}
        </p>
      ) : null}

      {showLiveIframe ? (
        <NautaLiveIframeBoundary onIframeFault={clearLiveIframe}>
          <iframe
            key={run.runId ?? "live"}
            src={run.liveViewUrl!}
            title="Nauta Live Browser View"
            className="live-view-iframe"
            sandbox="allow-scripts allow-same-origin"
            data-testid="nauta-live-iframe"
          />
        </NautaLiveIframeBoundary>
      ) : isRunning ? (
        <div className="live-slot live-view-placeholder">
          <div className="ring">
            ▷
            <span className="pulse" aria-hidden />
          </div>
          <h4>Esperando transmisión del navegador</h4>
          <p>
            El motor local no expone vista en vivo. Cuando{" "}
            <span className="mono">live_view_url</span> esté disponible, aparecerá aquí.
          </p>
        </div>
      ) : run.status === "idle" ? (
        <div className="live-slot live-view-placeholder">
          <div className="ring">
            ▷
            <span className="pulse" aria-hidden />
          </div>
          <h4>{idleHeading}</h4>
          <p>{idleBody}</p>
        </div>
      ) : null}

      {showReportPanel ? (
        <NautaRunReportPanel
          runId={run.runId!}
          status={run.status}
          taskName={taskName}
          taskInstruction={allowsFreeform ? taskInstruction : undefined}
          durationSeconds={run.durationSeconds}
          estimatedCostUsd={run.estimatedCostUsd}
          estimatedTokens={run.estimatedTokens}
          stepCount={run.stepCount}
          failureCause={run.failureCause}
          artifacts={run.artifacts}
          engineUsed={run.engineUsed}
          findingsCount={run.findingsCount}
          completedAtIso={run.completedAtIso!}
          apiCompletedAt={run.apiCompletedAt}
        />
      ) : null}

      {run.status === "blocked" ? (
        <div className="live-view-outcome live-view-outcome--blocked" role="alert">
          <span className="live-outcome-badge">Bloqueado</span>
          {run.failureCause ? <p className="live-failure-cause mono">{run.failureCause}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
