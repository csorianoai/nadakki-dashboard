"use client";

import { Suspense } from "react";
import { StepComplete } from "@/components/credit-hub/dealer/wizard/StepComplete";
import { DetailSkeleton } from "@/components/credit-hub/primitives";

export default function DealerApplicationSubmittedPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <StepComplete />
    </Suspense>
  );
}
