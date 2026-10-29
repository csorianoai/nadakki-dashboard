import { RealtorHome } from "@/components/realtor/RealtorHome";
import type { Metadata } from "next";
import { tituloRealtor } from "@/lib/realtor/titulos";

export const metadata: Metadata = { title: tituloRealtor("/realtor") };

export default function RealtorPage() {
  return <RealtorHome />;
}
