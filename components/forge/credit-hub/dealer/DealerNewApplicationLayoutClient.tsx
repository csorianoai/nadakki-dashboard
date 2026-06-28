"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { DealerWizardFrame } from "@/components/credit-hub/dealer/wizard/DealerWizardFrame";
import { DealerWizardProvider } from "@/components/forge/credit-hub/dealer/DealerWizardProvider";
import { DetailSkeleton } from "@/components/credit-hub/primitives";

export function DealerNewApplicationLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.includes("/applications/new/complete")) {
    return <>{children}</>;
  }
  // Key on the last path segment forces React to re-mount the page component
  // when the URL changes between wizard steps (fixes soft-navigation stale view).
  const stepSlug = pathname?.split("/").filter(Boolean).pop() ?? "applicant";
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <DealerWizardProvider>
        <DealerWizardFrame key={stepSlug}>{children}</DealerWizardFrame>
      </DealerWizardProvider>
    </Suspense>
  );
}
