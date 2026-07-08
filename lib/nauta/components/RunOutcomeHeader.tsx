import type { RunOutcomeModel } from "@/lib/nauta/runOutcome";

export function RunOutcomeHeader({ model }: { model: RunOutcomeModel }) {
  if (model.variant === "none") return null;

  const showBlock =
    model.headline || model.sublines.length > 0 || (model.emptyBody && !model.outputText);
  if (!showBlock) return null;

  return (
    <div
      className={`run-outcome-header run-outcome-header--${model.visualTone}`}
      data-testid="nauta-run-outcome-header"
      data-outcome-variant={model.variant}
      role={model.variant === "failed_without_output" ? "alert" : "status"}
    >
      {model.headline ? <p className="run-outcome-headline">{model.headline}</p> : null}
      {model.sublines.map((line) => (
        <p key={line} className="run-outcome-subline">
          {line}
        </p>
      ))}
      {model.emptyBody && !model.outputText ? (
        <p className="run-outcome-empty-body">{model.emptyBody}</p>
      ) : null}
    </div>
  );
}
