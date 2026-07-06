"use client";

import { useSearchParams } from "next/navigation";
import { NautaCockpitView } from "@/lib/nauta/components/NautaCockpitView";

export default function NautaCockpitPage() {
  const searchParams = useSearchParams();
  const mode = searchParams.get("mode");

  return <NautaCockpitView initialPisoMode={mode === "planes" ? "planes" : undefined} />;
}
