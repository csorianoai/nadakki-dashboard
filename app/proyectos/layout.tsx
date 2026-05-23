import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Proyectos | NADAKKI",
  description: "Projects Core — panel y operaciones de portafolio",
};

/**
 * Route content renders inside GlobalForgeAppShell (ForgeAppShell main slot under AppGate) —
 * do not nest another ForgeAppShell here.
 */
export default function ProyectosLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-0 bg-forgeSurface-page p-4 text-forgeGray-900 md:p-8">{children}</div>
  );
}
