import { PropiedadesPanel } from "@/components/realtor/propiedades/PropiedadesPanel";
import type { Metadata } from "next";
import { tituloRealtor } from "@/lib/realtor/titulos";

export const metadata: Metadata = { title: tituloRealtor("/realtor/propiedades") };

export default function PropiedadesPage() {
  return <PropiedadesPanel />;
}
