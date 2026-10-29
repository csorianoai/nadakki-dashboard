import { MiDiaPanel } from "@/components/realtor/mi-dia/MiDiaPanel";
import type { Metadata } from "next";
import { tituloRealtor } from "@/lib/realtor/titulos";

export const metadata: Metadata = { title: tituloRealtor("/realtor/mi-dia") };

export default function MiDiaPage() {
  return <MiDiaPanel />;
}
