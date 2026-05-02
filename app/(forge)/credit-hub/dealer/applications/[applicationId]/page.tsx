"use client";

import { use } from "react";
import { DealerApplicationStatusView } from "@/components/forge/credit-hub/DealerApplicationStatusView";

export default function DealerApplicationDetailPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);
  return <DealerApplicationStatusView applicationId={applicationId} />;
}
