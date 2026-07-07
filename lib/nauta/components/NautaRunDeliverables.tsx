import type { NautaRunArtifacts } from "@/lib/nauta/types";
import { S } from "@/lib/nauta/strings";

export function NautaRunDeliverables({
  artifacts,
  showLastStepSummary,
}: {
  artifacts: NautaRunArtifacts;
  /** Show lastStepSummary on failed runs per contract. */
  showLastStepSummary?: boolean;
}) {
  const { recordingUrls, screenshotUrl, output, lastStepSummary } = artifacts;
  const hasRecordings = recordingUrls.length > 0;
  const hasScreenshot = Boolean(screenshotUrl);
  const hasOutput = Boolean(output?.trim());
  const hasSummary = showLastStepSummary && Boolean(lastStepSummary?.trim());

  if (!hasRecordings && !hasScreenshot && !hasOutput && !hasSummary) {
    return null;
  }

  return (
    <section className="run-deliverables" data-testid="nauta-run-deliverables">
      <h4 className="run-deliverables-title">{S.live.deliverablesTitle}</h4>

      {hasRecordings ? (
        <div className="run-deliverables-block">
          <span className="run-deliverables-k">{S.live.recording}</span>
          <ul className="run-deliverables-links">
            {recordingUrls.map((url, i) => (
              <li key={`${url}-${i}`}>
                <a href={url} target="_blank" rel="noopener noreferrer" className="run-deliverables-link">
                  {recordingUrls.length > 1 ? `${S.live.recording} ${i + 1}` : S.live.recording}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {hasScreenshot ? (
        <div className="run-deliverables-block">
          <span className="run-deliverables-k">{S.live.screenshot}</span>
          <img
            src={screenshotUrl!}
            alt={S.live.screenshot}
            className="run-deliverables-shot"
            loading="lazy"
            decoding="async"
          />
        </div>
      ) : null}

      {hasOutput ? (
        <div className="run-deliverables-block">
          <span className="run-deliverables-k">{S.live.output}</span>
          <pre className="run-deliverables-output">{output}</pre>
        </div>
      ) : null}

      {hasSummary ? (
        <div className="run-deliverables-block">
          <span className="run-deliverables-k">{S.live.lastStepSummary}</span>
          <p className="run-deliverables-summary">{lastStepSummary}</p>
        </div>
      ) : null}
    </section>
  );
}
