import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Detalle de solicitud | NADAKKI",
  description: "Revisión de solicitud de crédito (banco).",
};

export default function BankApplicationDetailLayout({ children }: { children: ReactNode }) {
  return children;
}
