"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { DealerWizardChrome } from "./DealerWizardChrome";
import { DealerWizardProvider } from "./DealerWizardProvider";
import { Skeleton } from "@/components/forge";

export function DealerNewApplicationLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.includes("/applications/new/complete")) {
    return <>{children}</>;
  }
  return (
    <Suspense fallback={<Skeleton className="mx-auto min-h-[50vh] max-w-3xl rounded-forge-lg" />}>
      <DealerWizardProvider>
        <DealerWizardChrome>{children}</DealerWizardChrome>
      </DealerWizardProvider>
    </Suspense>
  );
}
