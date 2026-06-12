import { notFound } from "next/navigation";
import { MarketIntelClient } from "./components/MarketIntelClient";
import { isMarketIntelEnabled } from "./lib/feature-gate";

export default function MarketIntelPage() {
  if (!isMarketIntelEnabled()) {
    notFound();
  }
  return <MarketIntelClient />;
}
