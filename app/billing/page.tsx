import { Suspense } from "react";
import BillingPageClient from "./BillingPageClient";

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="ndk-page ndk-fade-in flex items-center justify-center min-h-[40vh] text-gray-400 text-sm">
          Cargando facturación…
        </div>
      }
    >
      <BillingPageClient />
    </Suspense>
  );
}
