import type { Metadata } from "next";
import type { ReactNode } from "react";
import BlueprintProjectsChrome from "@/components/proyectos/BlueprintProjectsChrome";

export const metadata: Metadata = {
  title: "Proyectos | NADAKKI",
  description: "Projects Core — blueprint vivo, portafolio y tableros",
};

/**
 * Superficie unificada "Blueprint vivo" (Marketing-aligned). Forge shell envuelve el slot principal.
 */
export default function ProyectosLayout({ children }: { children: ReactNode }) {
  return <BlueprintProjectsChrome>{children}</BlueprintProjectsChrome>;
}
