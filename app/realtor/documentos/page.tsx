import { DocumentosPanel } from "@/components/realtor/documentos/DocumentosPanel";
import type { Metadata } from "next";
import { tituloRealtor } from "@/lib/realtor/titulos";

export const metadata: Metadata = { title: tituloRealtor("/realtor/documentos") };

export default function DocumentosPage() {
  return <DocumentosPanel />;
}
