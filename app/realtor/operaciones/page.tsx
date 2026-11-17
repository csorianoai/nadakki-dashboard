import { OperacionesPanel } from "@/components/realtor/operaciones/OperacionesPanel";
import type { Metadata } from "next";
import { tituloRealtor } from "@/lib/realtor/titulos";

export const metadata: Metadata = { title: tituloRealtor("/realtor/operaciones") };

export default function OperacionesPage() {
  return <OperacionesPanel />;
}
