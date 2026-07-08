"use client";

import { S } from "@/lib/nauta/strings";

export function NautaLiveStallBanner({
  onStop,
  onCorrect,
  showCorrect,
}: {
  onStop: () => void;
  onCorrect: () => void;
  showCorrect: boolean;
}) {
  return (
    <div className="live-banner live-banner--stall" role="status" data-testid="nauta-stall-banner">
      <span>{S.midrun.stallHint}</span>
      <div className="live-banner-inline-actions">
        <button type="button" className="live-banner-link" onClick={onStop}>
          {S.midrun.stallStop}
        </button>
        {showCorrect ? (
          <>
            <span aria-hidden>·</span>
            <button type="button" className="live-banner-link" onClick={onCorrect}>
              {S.midrun.stallCorrect}
            </button>
          </>
        ) : null}
      </div>
    </div>
  );
}
