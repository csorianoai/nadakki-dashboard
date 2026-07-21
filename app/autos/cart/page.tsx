import { Suspense } from "react";
import { AutosCartContent } from "./AutosCartContent";

export default function AutosCartPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-[960px] px-[22px] py-8">
          <p className="text-sm text-nk-fg-muted">Cargando carrito…</p>
        </div>
      }
    >
      <AutosCartContent />
    </Suspense>
  );
}
