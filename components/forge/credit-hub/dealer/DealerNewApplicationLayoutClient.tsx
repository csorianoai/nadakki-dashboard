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
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <DealerWizardProvider>
        <DealerWizardFrame>{children}</DealerWizardFrame>
      </DealerWizardProvider>
    </Suspense>
  );
}
