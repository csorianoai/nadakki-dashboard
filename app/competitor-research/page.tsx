import { notFound } from "next/navigation";
import CompetitorResearchClient from "./CompetitorResearchClient";

export default function CompetitorResearchPage() {
  if (process.env.NEXT_PUBLIC_COMPETITIVE_RESEARCH_ENABLED !== "true") {
    notFound();
  }
  return <CompetitorResearchClient />;
}
