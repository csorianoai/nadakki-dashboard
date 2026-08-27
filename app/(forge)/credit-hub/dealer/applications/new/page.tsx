"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { DetailSkeleton } from "@/components/credit-hub/primitives";

function RedirectToApplicant() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useEffect(() => {
    const query = searchParams.toString();
    router.replace(`/credit-hub/dealer/applications/new/consent${query ? `?${query}` : ""}`);
  }, [router, searchParams]);
  return <DetailSkeleton />;
}

export default function DealerNewApplicationPage() {
  return (
    <Suspense fallback={<DetailSkeleton />}>
      <RedirectToApplicant />
    </Suspense>
  );
}
