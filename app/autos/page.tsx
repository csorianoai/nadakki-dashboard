import { Hero } from "@/components/marketing/Hero";
import { ResultCounter } from "@/components/marketing/ResultCounter";
import { BodyTypeGrid } from "@/components/marketing/BodyTypeGrid";
import { PathCards } from "@/components/marketing/PathCards";
import { ValueProps } from "@/components/marketing/ValueProps";
import { FeaturedVehicles } from "@/components/marketing/FeaturedVehicles";
import { BankPartners } from "@/components/marketing/BankPartners";
import { ApprovalComparator } from "@/components/marketing/ApprovalComparator";
import { TrustBar } from "@/components/marketing/TrustBar";
import { Testimonials } from "@/components/marketing/Testimonials";
import { PopularSearches } from "@/components/marketing/PopularSearches";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export default function AutosLandingPage() {
  return (
    <main>
      <Hero />
      <ResultCounter />
      <BodyTypeGrid />
      <PathCards />
      <ValueProps />
      <FeaturedVehicles />
      <BankPartners />
      <ApprovalComparator />
      <TrustBar />
      <Testimonials />
      <PopularSearches />
      <SiteFooter />
    </main>
  );
}
