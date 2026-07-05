import type { ReactNode } from "react";
import { NautaLayoutClient } from "@/lib/nauta/components/NautaLayoutClient";

export const metadata = {
  title: "Nauta — Empleados Digitales",
  description: "Cockpit de empleados digitales Nauta",
};

export default function NautaForgeLayout({ children }: { children: ReactNode }) {
  return <NautaLayoutClient>{children}</NautaLayoutClient>;
}
