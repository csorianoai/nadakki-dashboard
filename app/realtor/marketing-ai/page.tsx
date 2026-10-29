import { MarketingAiPanel } from "@/components/realtor/marketing-ai/MarketingAiPanel";
import type { Metadata } from "next";
import { tituloRealtor } from "@/lib/realtor/titulos";

export const metadata: Metadata = { title: tituloRealtor("/realtor/marketing-ai") };

export default function MarketingAiPage() {
  return <MarketingAiPanel />;
}
