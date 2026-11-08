import { Hero } from "@/components/marketing/Hero";
import { ResultCounter } from "@/components/marketing/ResultCounter";
import { BodyTypeGrid } from "@/components/marketing/BodyTypeGrid";
import { PopularBrands } from "@/components/marketing/PopularBrands";
import { PathCards } from "@/components/marketing/PathCards";
import { ValueProps } from "@/components/marketing/ValueProps";
import { FeaturedVehicles } from "@/components/marketing/FeaturedVehicles";
import { PopularSearches } from "@/components/marketing/PopularSearches";
import { PersonalShopperSection } from "@/components/shopper/PersonalShopperSection";
import { SiteFooter } from "@/components/marketing/SiteFooter";

export default function AutosLandingPage() {
  return (
    <main>
      <Hero />
      <ResultCounter />
      <BodyTypeGrid />
      <PopularBrands />
      <PathCards />
      <ValueProps />
      <FeaturedVehicles />
      <PopularSearches />
      <PersonalShopperSection />
      <SiteFooter />
    </main>
  );
}
