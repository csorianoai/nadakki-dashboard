import { ClientesPanel } from "@/components/realtor/clientes/ClientesPanel";
import type { Metadata } from "next";
import { tituloRealtor } from "@/lib/realtor/titulos";

export const metadata: Metadata = { title: tituloRealtor("/realtor/clientes") };

export default function ClientesPage() {
  return <ClientesPanel />;
}
