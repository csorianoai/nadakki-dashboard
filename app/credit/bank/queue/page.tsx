// COPIA SIN ENLACE. La viva es app/(forge)/credit-hub/**
import { redirect } from "next/navigation";
import { isBankPilotUiEnabled } from "@/lib/env/feature-bank-pilot-ui";

export default function CreditBankQueuePage() {
  if (!isBankPilotUiEnabled()) {
    return <p style={{ padding: 24 }}>Cola bancaria no disponible (NEXT_PUBLIC_BANK_PILOT_UI=off).</p>;
  }
  redirect("/credit-hub/bank/applications");
}
