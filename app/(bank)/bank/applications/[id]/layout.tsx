import type { Metadata } from "next";
import type { ReactNode } from "react";
import { RouteErrorBoundary } from "@/lib/observability/error-boundary";

export const metadata: Metadata = {
  title: "Detalle de solicitud | NADAKKI",
  description: "Revisión de solicitud de crédito (banco).",
};

export default function BankApplicationDetailLayout({ children }: { children: ReactNode }) {
  return <RouteErrorBoundary segment="bank.application.detail">{children}</RouteErrorBoundary>;
}
