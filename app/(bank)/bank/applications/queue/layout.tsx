import type { Metadata } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "Bandeja de solicitudes | NADAKKI",
  description: "Cola de solicitudes para analistas bancarios.",
};

export default function BankApplicationsQueueLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
