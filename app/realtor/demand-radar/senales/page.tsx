import { SignalsCenter } from "@/components/marketing/signals/SignalsCenter";
import type { Metadata } from "next";
import { tituloRealtor } from "@/lib/realtor/titulos";

export const metadata: Metadata = { title: tituloRealtor("/realtor/demand-radar/senales") };

export default function MercadoSenalesPage() {
  return <SignalsCenter />;
}
