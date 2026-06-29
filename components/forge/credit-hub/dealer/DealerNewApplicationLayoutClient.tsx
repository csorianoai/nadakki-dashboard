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
  // Key on the page outlet (not the chrome frame) so Next.js soft navigation
  // swaps the step segment component when the URL changes (#214 follow-up).
  const stepSlug = pathname?.split("/").filter(Boolean).pop() ?? "applicant";
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <DealerWizardProvider>
        <DealerWizardFrame>
          <div key={stepSlug}>{children}</div>
        </DealerWizardFrame>
      </DealerWizardProvider>
    </Suspense>
  );
}
