import { PropertyIntelIndex } from "@/components/realtor/property-intel/PropertyIntelIndex";
import type { Metadata } from "next";
import { tituloRealtor } from "@/lib/realtor/titulos";

export const metadata: Metadata = { title: tituloRealtor("/realtor/property-intel") };

export default function PropertyIntelIndexPage() {
  return <PropertyIntelIndex />;
}
