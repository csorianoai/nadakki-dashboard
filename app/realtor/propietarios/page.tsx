import { PropietariosPanel } from "@/components/realtor/propietarios/PropietariosPanel";
import type { Metadata } from "next";
import { tituloRealtor } from "@/lib/realtor/titulos";

export const metadata: Metadata = { title: tituloRealtor("/realtor/propietarios") };

export default function PropietariosPage() {
  return <PropietariosPanel />;
}
