"use client";

import type { PilotLabels } from "@/lib/credit-hub/labels/pilot-labels";
import { isBankPilotUiEnabled } from "@/lib/env/feature-bank-pilot-ui";
import { CreditDataSourceBadge } from "./CreditDataSourceBadge";
import { KycModeBadge } from "./KycModeBadge";
import { OcrModeBadge } from "./OcrModeBadge";

export function PilotLabelsRow({ labels, prominent }: { labels: PilotLabels; prominent?: boolean }) {
  if (!isBankPilotUiEnabled()) return null;
  return (
    <div
      data-testid="pilot-labels-row"
      className={prominent ? "mb-3 flex flex-wrap gap-2" : "flex flex-wrap gap-2"}
      style={prominent ? { padding: "10px 12px", borderRadius: 10, background: "var(--ch-surface-2)", border: "1px solid var(--ch-border)" } : undefined}
    >
      <CreditDataSourceBadge value={labels.data_source_label} />
      <KycModeBadge value={labels.kyc_mode} />
      <OcrModeBadge value={labels.ocr_mode} />
    </div>
  );
}
