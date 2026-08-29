// COPIA SIN ENLACE. La viva es app/(forge)/credit-hub/**
import type { Metadata } from "next";
import { BankApplicationDetailErrorBoundary } from "@/components/bank-application-detail/BankApplicationDetailErrorBoundary";
import { StipulationsAdminClient } from "./StipulationsAdminClient";

export const metadata: Metadata = {
  title: "Estipulaciones | NADAKKI",
  description: "Gestión de estipulaciones por solicitud (mesa bancaria).",
};

export default function BankApplicationStipulationsPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <BankApplicationDetailErrorBoundary>
      <StipulationsAdminClient params={params} />
    </BankApplicationDetailErrorBoundary>
  );
}
