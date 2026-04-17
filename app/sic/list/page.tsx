import { redirect } from "next/navigation";

/**
 * Route alias for external scans / deep links.
 * Product list surface: expedientes (cartera operativa). Bandeja remains the intake inbox.
 * No duplicate UI here — avoids drift from the canonical expedientes module.
 */
export default function SicListAliasPage() {
  redirect("/sic/expedientes");
}
