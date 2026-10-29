import { CareerDirectorPanel } from "@/components/realtor/career-director/CareerDirectorPanel";
import type { Metadata } from "next";
import { tituloRealtor } from "@/lib/realtor/titulos";

export const metadata: Metadata = { title: tituloRealtor("/realtor/career-director") };

export default function CareerDirectorPage() {
  return <CareerDirectorPanel />;
}
