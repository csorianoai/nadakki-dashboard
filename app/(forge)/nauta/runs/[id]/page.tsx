"use client";

import { useParams } from "next/navigation";
import { NautaRunDetailView } from "@/lib/nauta/components/NautaRunDetailView";

export default function NautaRunDetailPage() {
  const params = useParams();
  const runId = typeof params.id === "string" ? params.id : "";
  return <NautaRunDetailView runId={runId} />;
}
