"use client";

import { Suspense, useEffect } from "react";
import { useRouter } from "next/navigation";
import { DetailSkeleton } from "@/components/credit-hub/primitives";

function RedirectToApplicant() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/credit-hub/dealer/applications/new/applicant");
  }, [router]);
  return <DetailSkeleton />;
}

export default function DealerNewApplicationPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <RedirectToApplicant />
    </Suspense>
  );
}
