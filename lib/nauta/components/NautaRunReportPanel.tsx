"use client";

import { useCallback, useState } from "react";
import type { NautaLiveViewStatus } from "@/lib/nauta/types";
import {
  buildRunReportDownloadText,
  collectBackendGaps,
  isVideoRecordingUrl,
  type RunReportInput,
} from "@/lib/nauta/runReportUtils";
import { formatNumber } from "@/lib/nauta/format";
import { S } from "@/lib/nauta/strings";

export interface NautaRunReportPanelProps extends RunReportInput {
  engineUsed: string | null;
  findingsCount: number;
}

function statusLabel(status: NautaLiveViewStatus): string {
  if (status === "completed") return S.report.statusCompleted;
  if (status === "failed") return S.report.statusFailed;
  return status;
}

export function NautaRunReportPanel(props: NautaRunReportPanelProps) {
  const {
    runId,
    status,
    taskName,
    taskInstruction,
    durationSeconds,
    estimatedCostUsd,
    estimatedTokens,
    stepCount,
    failureCause,
    artifacts,
    engineUsed,
    findingsCount,
    completedAtIso,
    apiCompletedAt,
  } = props;

  const [copyState, setCopyState] = useState<"idle" | "ok" | "fail">("idle");
  const gaps = collectBackendGaps(props);
  const outputText = artifacts?.output?.trim() ?? "";
  const showLastStep = Boolean(artifacts?.lastStepSummary?.trim());
  const recordings = artifacts?.recordingUrls ?? [];

  const handleCopy = useCallback(async () => {
    const text = outputText || buildRunReportDownloadText(props);
    try {
      await navigator.clipboard.writeText(text);
      setCopyState("ok");
      window.setTimeout(() => setCopyState("idle"), 2000);
    } catch {
      setCopyState("fail");
      window.setTimeout(() => setCopyState("idle"), 2500);
    }
  }, [outputText, props]);

  const handleDownload = useCallback(() => {
    const body = buildRunReportDownloadText(props);
    const blob = new Blob([body], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `nauta-run-${runId}-report.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }, [props, runId]);

  return (
    <section className="run-report" data-testid="nauta-run-report-panel">
      <div className="run-report-layout">
        <div className="run-report-summary">
          <h4 className="run-report-heading">{S.report.summaryTitle}</h4>
          <dl className="run-report-kv">
            <div>
              <dt>{S.report.taskAssigned}</dt>
              <dd className="mono">{taskName}</dd>
            </div>
            {taskInstruction?.trim() ? (
              <div>
                <dt>{S.report.instruction}</dt>
                <dd>{taskInstruction.trim()}</dd>
              </div>
            ) : null}
            <div>
              <dt>{S.report.status}</dt>
              <dd>{statusLabel(status)}</dd>
            </div>
            <div>
              <dt>{S.report.duration}</dt>
              <dd className="num">{durationSeconds.toFixed(1)} s</dd>
            </div>
            {stepCount != null ? (
              <div>
                <dt>{S.report.stepCount}</dt>
                <dd className="num">{stepCount}</dd>
              </div>
            ) : null}
            <div>
              <dt>{S.report.cost}</dt>
              <dd className="num">${estimatedCostUsd.toFixed(4)} USD</dd>
            </div>
            {estimatedTokens > 0 ? (
              <div>
                <dt>{S.report.tokens}</dt>
                <dd className="num">{formatNumber(estimatedTokens)}</dd>
              </div>
            ) : null}
            {findingsCount > 0 ? (
              <div>
                <dt>{S.report.findings}</dt>
                <dd className="num">{findingsCount}</dd>
              </div>
            ) : null}
            {engineUsed ? (
              <div>
                <dt>{S.report.engine}</dt>
                <dd className="mono">{engineUsed}</dd>
              </div>
            ) : null}
            <div>
              <dt>{S.report.runId}</dt>
              <dd className="mono">{runId}</dd>
            </div>
            <div>
              <dt>{S.report.timestamp}</dt>
              <dd className="mono">{apiCompletedAt ?? completedAtIso}</dd>
            </div>
          </dl>
          {failureCause ? (
            <p className="run-report-failure mono" role="alert">
              {failureCause}
            </p>
          ) : null}
        </div>

        <div className="run-report-agent">
          <div className="run-report-agent-head">
            <h4 className="run-report-heading">{S.report.agentTitle}</h4>
            <div className="run-report-actions">
              <button type="button" className="btn ghost" onClick={() => void handleCopy()} data-testid="nauta-copy-report">
                {copyState === "ok" ? S.report.copied : copyState === "fail" ? S.report.copyFailed : S.report.copyReport}
              </button>
              <button type="button" className="btn" onClick={handleDownload} data-testid="nauta-download-report">
                {S.report.downloadReport}
              </button>
            </div>
          </div>

          {showLastStep ? (
            <div className="run-report-block">
              <span className="run-report-label">{S.live.lastStepSummary}</span>
              <p className="run-report-summary-text">{artifacts!.lastStepSummary}</p>
            </div>
          ) : null}

          <div className="run-report-block">
            <span className="run-report-label">{S.live.output}</span>
            {outputText ? (
              <pre className="run-report-output mono" tabIndex={0}>
                {outputText}
              </pre>
            ) : (
              <p className="run-report-empty">{S.report.outputMissing}</p>
            )}
          </div>

          {recordings.length > 0 ? (
            <div className="run-report-block">
              <span className="run-report-label">{S.live.recording}</span>
              <ul className="run-report-recordings">
                {recordings.map((url, i) => (
                  <li key={`${url}-${i}`}>
                    {isVideoRecordingUrl(url) ? (
                      <video className="run-report-video" controls preload="metadata" src={url}>
                        <a href={url} target="_blank" rel="noopener noreferrer" className="run-report-link">
                          {S.report.openRecording}
                        </a>
                      </video>
                    ) : (
                      <a href={url} target="_blank" rel="noopener noreferrer" className="run-report-link">
                        {recordings.length > 1 ? `${S.live.recording} ${i + 1}` : S.report.openRecording}
                      </a>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {artifacts?.screenshotUrl ? (
            <div className="run-report-block">
              <span className="run-report-label">{S.live.screenshot}</span>
              <img
                src={artifacts.screenshotUrl}
                alt={S.live.screenshot}
                className="run-report-shot"
                loading="lazy"
                decoding="async"
              />
            </div>
          ) : null}
        </div>
      </div>

      {gaps.length > 0 ? (
        <aside className="run-report-gaps" data-testid="nauta-backend-gaps">
          <p className="run-report-gaps-title">{S.report.gapTitle}</p>
          <ul>
            {gaps.map((field) => (
              <li key={field}>
                <code className="mono">{field}</code>
              </li>
            ))}
          </ul>
        </aside>
      ) : null}
    </section>
  );
}
