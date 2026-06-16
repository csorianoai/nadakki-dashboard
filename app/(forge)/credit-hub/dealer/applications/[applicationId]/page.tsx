"use client";

import { use } from "react";
import { DealerApplicationDetailView } from "@/components/credit-hub/dealer/DealerApplicationDetailView";

export default function DealerApplicationDetailPage({ params }: { params: Promise<{ applicationId: string }> }) {
  const { applicationId } = use(params);
  return <DealerApplicationDetailView applicationId={applicationId} />;
}
