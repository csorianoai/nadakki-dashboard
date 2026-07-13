import { MatrixView } from "@/components/cockpit/finance/matrix/MatrixView";
import { notFound } from "next/navigation";
import { COCKPIT_FINANCE_FLAGS } from "@/lib/cockpit/finance-v3/flags";

export default function CockpitFinanceMatrixPage() {
  if (!COCKPIT_FINANCE_FLAGS.COCKPIT_FINANCE_MATRIX_ENABLED) {
    notFound();
  }
  return <MatrixView />;
}
