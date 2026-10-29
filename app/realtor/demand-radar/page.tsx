import { DemandRadarPanel } from "@/components/realtor/DemandRadarPanel";
import type { Metadata } from "next";
import { tituloRealtor } from "@/lib/realtor/titulos";

export const metadata: Metadata = { title: tituloRealtor("/realtor/demand-radar") };

export default function DemandRadarPage() {
  return <DemandRadarPanel />;
}
