import { AgentSitePanel } from "@/components/realtor/AgentSitePanel";
import type { Metadata } from "next";
import { tituloRealtor } from "@/lib/realtor/titulos";

export const metadata: Metadata = { title: tituloRealtor("/realtor/agente-web") };

export default function AgentSitePage() {
  return <AgentSitePanel />;
}
