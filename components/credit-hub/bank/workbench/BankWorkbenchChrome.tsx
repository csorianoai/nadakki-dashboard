"use client";

import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { KpiCardTrend } from "@/components/credit-hub/bank/shared/bankUi";
import type { DataTruthLevel } from "@/lib/credit-hub/honesty/data-truth";
import type { ComponentProps } from "react";

export function BankWorkbenchKpi({
  truth,
  ...props
}: ComponentProps<typeof KpiCardTrend> & { truth: DataTruthLevel }) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1 }}>
        <DataTruthBadge level={truth} />
      </div>
      <KpiCardTrend {...props} />
    </div>
  );
}
