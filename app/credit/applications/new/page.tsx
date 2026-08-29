// COPIA SIN ENLACE. La viva es app/(forge)/credit-hub/**
import { redirect } from "next/navigation";
import { isBankPilotUiEnabled } from "@/lib/env/feature-bank-pilot-ui";

/** T02 contract alias → Forge dealer wizard (6 logical steps across 5 routes). */
export default function CreditApplicationsNewPage() {
  if (!isBankPilotUiEnabled()) {
    return <p style={{ padding: 24 }}>Wizard no disponible (NEXT_PUBLIC_BANK_PILOT_UI=off).</p>;
  }
  redirect("/credit-hub/dealer/applications/new/applicant");
}
