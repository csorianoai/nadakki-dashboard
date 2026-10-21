import { Suspense } from "react";
import { OperacionesPanel } from "@/components/realtor/operaciones/OperacionesPanel";

export default function OperacionesPage() {
  return (
    <Suspense fallback={null}>
      <OperacionesPanel />
    </Suspense>
  );
}
