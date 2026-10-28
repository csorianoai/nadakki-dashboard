import { BrokerPanel } from "@/components/realtor/broker/BrokerPanel";
import type { Metadata } from "next";
import { tituloRealtor } from "@/lib/realtor/titulos";

export const metadata: Metadata = { title: tituloRealtor("/realtor/broker") };

export default function BrokerPage() {
  return <BrokerPanel />;
}
